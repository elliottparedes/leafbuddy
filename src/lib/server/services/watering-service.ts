import { and, eq, lte } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { plantSpecies, userPlants, wateringLog, wateringSchedules } from '$lib/server/db/schema';
import { plantRepository } from '$lib/server/repositories/plant-repository';
import type { ServiceResult } from '$lib/server/services/result';

export function getIntervalDays(
	useRecommended: boolean,
	customIntervalDays: number | null | undefined,
	recommendedIntervalDays: number
): number {
	if (useRecommended) return recommendedIntervalDays;
	return customIntervalDays && customIntervalDays > 0 ? customIntervalDays : recommendedIntervalDays;
}

/** Apply preferred time (HH:mm) to a date. */
export function applyPreferredTime(date: Date, preferredTime: string): Date {
	const [hours, minutes] = preferredTime.split(':').map((v) => Number(v));
	const result = new Date(date);
	result.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
	return result;
}

/** Compute the next watering datetime from last watered + interval. */
export function computeNextWaterAt(input: {
	lastWateredAt: Date | null;
	intervalDays: number;
	preferredTime?: string;
	from?: Date;
}): Date {
	const base = input.lastWateredAt ?? input.from ?? new Date();
	const next = new Date(base);
	next.setDate(next.getDate() + input.intervalDays);
	return applyPreferredTime(next, input.preferredTime ?? '09:00');
}

export const wateringService = {
	async createScheduleForPlant(input: {
		userPlantId: string;
		useRecommendedSchedule: boolean;
		customIntervalDays?: number | null;
		recommendedIntervalDays: number;
		preferredTime?: string;
		reminderEnabled?: boolean;
	}) {
		const intervalDays = getIntervalDays(
			input.useRecommendedSchedule,
			input.customIntervalDays,
			input.recommendedIntervalDays
		);
		// When plant is first added, it's eligible for watering immediately
		// so user can mark it as watered to start the schedule
		const nextWaterAt = new Date();

		const id = crypto.randomUUID();
		await db.insert(wateringSchedules).values({
			id,
			userPlantId: input.userPlantId,
			useRecommendedSchedule: input.useRecommendedSchedule,
			customIntervalDays: input.customIntervalDays ?? null,
			preferredTime: input.preferredTime ?? '09:00',
			nextWaterAt,
			reminderEnabled: input.reminderEnabled ?? true
		});
		return id;
	},

	async updateSchedule(
		userPlantId: string,
		input: {
			useRecommendedSchedule?: boolean;
			customIntervalDays?: number | null;
			preferredTime?: string;
			reminderEnabled?: boolean;
		}
	): Promise<ServiceResult<void>> {
		const plant = await plantRepository.findUserPlantById(userPlantId);
		if (!plant?.schedule) {
			return { ok: false, message: 'Watering schedule not found.' };
		}

		const useRecommended = input.useRecommendedSchedule ?? plant.schedule.useRecommendedSchedule;
		const customIntervalDays =
			input.customIntervalDays !== undefined
				? input.customIntervalDays
				: plant.schedule.customIntervalDays;
		const preferredTime = input.preferredTime ?? plant.schedule.preferredTime;
		const intervalDays = getIntervalDays(
			useRecommended,
			customIntervalDays,
			plant.species.recommendedWateringIntervalDays
		);
		const nextWaterAt = computeNextWaterAt({
			lastWateredAt: plant.schedule.lastWateredAt,
			intervalDays,
			preferredTime
		});

		await db
			.update(wateringSchedules)
			.set({
				useRecommendedSchedule: useRecommended,
				customIntervalDays: useRecommended ? null : customIntervalDays,
				preferredTime,
				reminderEnabled: input.reminderEnabled ?? plant.schedule.reminderEnabled,
				nextWaterAt,
				updatedAt: new Date()
			})
			.where(eq(wateringSchedules.userPlantId, userPlantId));

		return { ok: true, data: undefined };
	},

	async markWatered(
		userPlantId: string,
		userId: string,
		notes?: string | null
	): Promise<ServiceResult<{ nextWaterAt: Date }>> {
		const plant = await plantRepository.findUserPlantById(userPlantId, userId);
		if (!plant) {
			return { ok: false, message: 'Plant not found.' };
		}
		if (!plant.schedule) {
			return { ok: false, message: 'Watering schedule not found.' };
		}

		const now = new Date();
		const intervalDays = getIntervalDays(
			plant.schedule.useRecommendedSchedule,
			plant.schedule.customIntervalDays,
			plant.species.recommendedWateringIntervalDays
		);
		const nextWaterAt = computeNextWaterAt({
			lastWateredAt: now,
			intervalDays,
			preferredTime: plant.schedule.preferredTime
		});

		await db.insert(wateringLog).values({
			id: crypto.randomUUID(),
			userPlantId,
			wateredAt: now,
			notes: notes ?? null
		});

		await db
			.update(wateringSchedules)
			.set({
				lastWateredAt: now,
				nextWaterAt,
				updatedAt: new Date()
			})
			.where(eq(wateringSchedules.userPlantId, userPlantId));

		return { ok: true, data: { nextWaterAt } };
	},

	async findDuePlants(now = new Date()) {
		return db
			.select({
				schedule: wateringSchedules,
				plant: userPlants,
				species: plantSpecies
			})
			.from(wateringSchedules)
			.innerJoin(userPlants, eq(wateringSchedules.userPlantId, userPlants.id))
			.innerJoin(plantSpecies, eq(userPlants.plantSpeciesId, plantSpecies.id))
			.where(
				and(
					eq(wateringSchedules.reminderEnabled, true),
					lte(wateringSchedules.nextWaterAt, now)
				)
			);
	}
};