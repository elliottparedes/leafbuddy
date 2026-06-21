import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { failIfError } from '$lib/server/actions/handle-result';
import { userService } from '$lib/server/services/user-service';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();
	if (session?.user) redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ request }) => {
		const err = failIfError(await userService.registerFromForm(await request.formData()));
		if (err) return err;
		redirect(303, '/login?registered=1');
	}
};