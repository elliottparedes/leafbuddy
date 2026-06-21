import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { failIfError, unwrapResult } from '$lib/server/actions/handle-result';
import { plantRepository } from '$lib/server/repositories/plant-repository';
import { plantService } from '$lib/server/services/plant-service';
import { wateringService } from '$lib/server/services/watering-service';
import { formTrimmed } from '$lib/server/validation/form';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { session } = await parent();
	const row = await plantRepository.findUserPlantById(params.id, session.user!.id);
	if (!row) error(404, 'Plant not found');

	const progressPhotos = await plantRepository.listProgressPhotos(row.plant.id);

	return {
		plant: {
			id: row.plant.id,
			nickname: row.plant.nickname,
			location: row.plant.location,
			notes: row.plant.notes,
			hasCoverImage: Boolean(row.plant.coverImage)
		},
		species: {
			id: row.species.id,
			name: row.species.name,
			scientificName: row.species.scientificName,
			recommendedWateringIntervalDays: row.species.recommendedWateringIntervalDays
		},
		schedule: row.schedule
			? {
					useRecommendedSchedule: row.schedule.useRecommendedSchedule,
					customIntervalDays: row.schedule.customIntervalDays,
					preferredTime: row.schedule.preferredTime,
					lastWateredAt: row.schedule.lastWateredAt,
					nextWaterAt: row.schedule.nextWaterAt,
					reminderEnabled: row.schedule.reminderEnabled
				}
			: null,
		progressPhotos
	};
};

export const actions: Actions = {
	markWatered: async ({ params, locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, '/login');

		const result = await wateringService.markWatered(params.id, session.user.id);
		const err = failIfError(result);
		if (err) return err;
		return { success: true, nextWaterAt: unwrapResult(result).nextWaterAt.toISOString() };
	},

	updateSchedule: async ({ params, request, locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, '/login');

		const formData = await request.formData();
		const useRecommended = formData.get('useRecommendedSchedule') === 'true';
		const customIntervalDays = formTrimmed(formData, 'customIntervalDays');
		const reminderEnabled = formData.get('reminderEnabled') === 'true';

		const result = await wateringService.updateSchedule(params.id, {
			useRecommendedSchedule: useRecommended,
			customIntervalDays: useRecommended ? null : Number(customIntervalDays) || null,
			reminderEnabled
		});
		const err = failIfError(result);
		if (err) return err;
		return { success: true };
	},

	uploadPhoto: async ({ params, request, locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, '/login');

		const result = await plantService.uploadProgressPhotoFromForm(
			session.user.id,
			params.id,
			await request.formData()
		);
		const err = failIfError(result);
		if (err) return err;
		return { success: true };
	}
};