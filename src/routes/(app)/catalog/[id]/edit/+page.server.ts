import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { failIfError } from '$lib/server/actions/handle-result';
import { plantRepository } from '$lib/server/repositories/plant-repository';
import { plantService } from '$lib/server/services/plant-service';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
	await parent();
	const session = await locals.auth();
	if (!session?.user?.id) redirect(303, '/login');

	const species = await plantRepository.findSpeciesById(params.id);
	if (!species) {
		error(404, 'Species not found');
	}

	// For now: any logged-in user can edit (relaxed)
	// if (species.createdByUserId !== session.user.id) {
	// 	error(403, 'You can only edit species you contributed.');
	// }

	const images = await plantRepository.listSpeciesImages(params.id);

	return {
		species: {
			id: species.id,
			name: species.name,
			scientificName: species.scientificName,
			description: species.description,
			careTips: species.careTips,
			recommendedWateringIntervalDays: species.recommendedWateringIntervalDays,
			recommendedFertilizingIntervalDays: species.recommendedFertilizingIntervalDays,
			lightRequirement: species.lightRequirement,
			humidityPreference: species.humidityPreference
		},
		images
	};
};

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, '/login');

		const result = await plantService.updateSpeciesFromForm(
			session.user.id,
			params.id,
			await request.formData()
		);
		const err = failIfError(result);
		if (err) return err;

		redirect(303, `/catalog/${params.id}`);
	},

	deleteImage: async ({ request, locals, params }) => {
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, '/login');

		const formData = await request.formData();
		const imageId = formData.get('imageId')?.toString();
		if (!imageId) {
			return { message: 'No image specified' };
		}

		const result = await plantService.deleteSpeciesImage(session.user.id, imageId);
		const err = failIfError(result);
		if (err) return err;

		redirect(303, `/catalog/${params.id}/edit`);
	},

	setPrimary: async ({ request, locals, params }) => {
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, '/login');

		const formData = await request.formData();
		const imageId = formData.get('imageId')?.toString();
		if (!imageId) {
			return { message: 'No image specified' };
		}

		const result = await plantService.setSpeciesImagePrimary(session.user.id, params.id, imageId);
		const err = failIfError(result);
		if (err) return err;

		redirect(303, `/catalog/${params.id}/edit`);
	}
};
