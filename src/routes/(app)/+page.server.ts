import type { PageServerLoad } from './$types';
import { plantRepository } from '$lib/server/repositories/plant-repository';

export const load: PageServerLoad = async ({ parent }) => {
	const { session } = await parent();
	const plants = await plantRepository.listUserPlants(session.user!.id);

	return {
		plants: plants.map((row) => ({
			id: row.plant.id,
			nickname: row.plant.nickname,
			speciesName: row.species.name,
			hasCoverImage: Boolean(row.plant.coverImage),
			nextWaterAt: row.schedule?.nextWaterAt ?? null,
			reminderEnabled: row.schedule?.reminderEnabled ?? true
		}))
	};
};