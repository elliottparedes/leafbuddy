import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { failIfError, unwrapResult } from '$lib/server/actions/handle-result';
import { plantRepository } from '$lib/server/repositories/plant-repository';
import { plantService } from '$lib/server/services/plant-service';
import { suggestNickname } from '$lib/plant-names';

export const load: PageServerLoad = async ({ parent, url }) => {
	await parent();
	const species = await plantRepository.listApprovedSpecies();
	const preselectedId = url.searchParams.get('species') ?? '';
	const preselected = species.find((s) => s.id === preselectedId);

	return {
		species: species.map((s) => ({
			id: s.id,
			name: s.name,
			recommendedWateringIntervalDays: s.recommendedWateringIntervalDays
		})),
		preselectedId,
		suggestedNickname: preselected ? suggestNickname(preselected.name) : ''
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, '/login');

		const result = await plantService.addUserPlantFromForm(session.user.id, await request.formData());
		const err = failIfError(result);
		if (err) return err;

		redirect(303, `/my-plants/${unwrapResult(result).id}`);
	}
};