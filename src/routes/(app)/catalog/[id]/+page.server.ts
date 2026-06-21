import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { plantRepository } from '$lib/server/repositories/plant-repository';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = await locals.auth();
	const species = await plantRepository.findSpeciesById(params.id);
	if (!species || species.moderationStatus !== 'approved') {
		error(404, 'Species not found');
	}

	const images = await plantRepository.listSpeciesImages(species.id);

	const canEdit = !!session?.user?.id; // For now, allow any logged-in user to edit the catalog (including images)

	return {
		species: {
			id: species.id,
			name: species.name,
			scientificName: species.scientificName,
			description: species.description,
			careTips: species.careTips,
			lightRequirement: species.lightRequirement,
			humidityPreference: species.humidityPreference,
			recommendedWateringIntervalDays: species.recommendedWateringIntervalDays,
			recommendedFertilizingIntervalDays: species.recommendedFertilizingIntervalDays
		},
		images,
		canEdit
	};
};