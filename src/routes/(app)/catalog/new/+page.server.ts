import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { failIfError } from '$lib/server/actions/handle-result';
import { plantService } from '$lib/server/services/plant-service';

export const load: PageServerLoad = async ({ parent, url }) => {
	await parent();
	const initialName = url.searchParams.get('name') ?? '';
	return { initialName };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, '/login');

		const result = await plantService.contributeSpeciesFromForm(
			session.user.id,
			await request.formData()
		);
		const err = failIfError(result);
		if (err) return err;

		redirect(303, '/catalog');
	}
};