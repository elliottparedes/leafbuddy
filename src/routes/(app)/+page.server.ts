import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { failIfError } from '$lib/server/actions/handle-result';
import { plantRepository } from '$lib/server/repositories/plant-repository';
import { wateringService } from '$lib/server/services/watering-service';
import { plantService } from '$lib/server/services/plant-service';
import { formTrimmed } from '$lib/server/validation/form';
import { log } from '$lib/server/logger';

export const load: PageServerLoad = async ({ parent }) => {
	const { session } = await parent();
	const plantsRaw = await plantRepository.listUserPlants(session.user!.id);

	const plants = await Promise.all(
		plantsRaw.map(async (row) => {
			const progressPhotos = await plantRepository.listProgressPhotos(row.plant.id);
			return {
				id: row.plant.id,
				nickname: row.plant.nickname,
				speciesName: row.species.name,
				speciesScientificName: row.species.scientificName ?? null,
				hasCoverImage: Boolean(row.plant.coverImage),
				location: row.plant.location ?? null,
				notes: row.plant.notes ?? null,
				nextWaterAt: row.schedule?.nextWaterAt ?? null,
				lastWateredAt: row.schedule?.lastWateredAt ?? null,
				schedule: row.schedule
					? {
							useRecommendedSchedule: row.schedule.useRecommendedSchedule,
							customIntervalDays: row.schedule.customIntervalDays,
							reminderEnabled: row.schedule.reminderEnabled
						}
					: null,
				progressPhotos: progressPhotos.map((p) => ({
					id: p.id,
					takenAt: p.takenAt,
					caption: p.caption ?? null
				})),
				recommendedWateringIntervalDays: row.species.recommendedWateringIntervalDays
			};
		})
	);

	return { plants };
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
}

export const actions: Actions = {
	markWatered: async ({ request, locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, '/login');

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (id) {
			await log(`Mark watered for plant ${id}`);
			await wateringService.markWatered(id, session.user.id);
		}
		redirect(303, '/');
	},

	updateSchedule: async ({ request, locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, '/login');

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (!id) return;

		const useRecommended = formData.get('useRecommendedSchedule') === 'true' || formData.get('useRecommendedSchedule') === 'on';
		const customIntervalDays = formTrimmed(formData, 'customIntervalDays');
		const reminderEnabled = formData.get('reminderEnabled') === 'true' || formData.get('reminderEnabled') === 'on';

		await log(`Update schedule for plant ${id}`);
		await wateringService.updateSchedule(id, {
			useRecommendedSchedule: useRecommended,
			customIntervalDays: useRecommended ? null : parsePositiveInt(customIntervalDays, 7),
			reminderEnabled
		});
		redirect(303, '/');
	},

	uploadPhoto: async ({ request, locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, '/login');

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const photo = formData.get('photo');
		
		await log(`Upload photo request for plant ${id}, has photo: ${!!photo}`);

		if (!id) return;

		const result = await plantService.uploadProgressPhotoFromForm(
			session.user.id,
			id,
			formData
		);
		if (!result.ok) {
			await log(`Upload failed for ${id}: ${result.message || 'unknown'}`, 'ERROR');
			return failIfError(result);
		}

		await log(`Upload success for plant ${id}`);
		redirect(303, '/');
	},

	removePhoto: async ({ request, locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, '/login');

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const photoId = formData.get('photoId')?.toString();
		const removeCover = formData.get('removeCover') === 'true';

		if (!id) return;

		if (removeCover) {
			await log(`Remove cover for plant ${id}`);
			const result = await plantService.removeUserPlantCover(session.user.id, id);
			if (!result.ok) {
				return failIfError(result);
			}
		} else if (photoId) {
			await log(`Remove progress photo ${photoId} for plant ${id}`);
			const result = await plantService.deleteProgressPhoto(session.user.id, photoId);
			if (!result.ok) {
				return failIfError(result);
			}
		}
		redirect(303, '/');
	},

	updatePlant: async ({ request, locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, '/login');

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (!id) return;

		const nickname = formTrimmed(formData, 'nickname');
		const location = formTrimmed(formData, 'location');
		const notes = formTrimmed(formData, 'notes');

		await log(`Update plant ${id}`);
		const result = await plantService.updateUserPlant(session.user.id, id, {
			nickname: nickname || undefined,
			location: location ?? null,
			notes: notes ?? null
		});
		if (!result.ok) {
			return failIfError(result);
		}

		// Handle schedule fields (moved into the edit dialog / pencil)
		const useRecommendedScheduleStr = formData.get('useRecommendedSchedule')?.toString();
		if (useRecommendedScheduleStr !== undefined) {
			const useRecommendedSchedule = useRecommendedScheduleStr === 'true';
			const customIntervalDays = formTrimmed(formData, 'customIntervalDays');
			const reminderEnabledStr = formData.get('reminderEnabled')?.toString();
			const reminderEnabled = reminderEnabledStr === 'true';

			await log(`Update schedule for plant ${id} (via edit dialog)`);
			const schedResult = await wateringService.updateSchedule(id, {
				useRecommendedSchedule,
				customIntervalDays: useRecommendedSchedule ? null : parsePositiveInt(customIntervalDays, 7),
				reminderEnabled
			});
			if (!schedResult.ok) {
				return failIfError(schedResult);
			}
		}

		redirect(303, '/');
	},

	deletePlant: async ({ request, locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, '/login');

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (!id) return;

		await log(`Delete plant ${id}`);
		const result = await plantService.deleteUserPlant(session.user.id, id);
		if (!result.ok) {
			return failIfError(result);
		}

		redirect(303, '/');
	}
};