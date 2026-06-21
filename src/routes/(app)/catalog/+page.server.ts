import type { PageServerLoad } from './$types';
import { plantRepository } from '$lib/server/repositories/plant-repository';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('q') ?? undefined;
	const species = await plantRepository.listApprovedSpecies(search);

	const speciesWithImages = await Promise.all(
		species.map(async (item) => {
			const imageId = await plantRepository.getPrimarySpeciesImageId(item.id);
			return {
				id: item.id,
				name: item.name,
				scientificName: item.scientificName,
				lightRequirement: item.lightRequirement,
				recommendedWateringIntervalDays: item.recommendedWateringIntervalDays,
				imageId
			};
		})
	);

	return { species: speciesWithImages, search: search ?? '' };
};