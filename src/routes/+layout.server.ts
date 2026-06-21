import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/** Redirect unauthenticated visitors away from the app home. */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	const session = await locals.auth();

	if (url.pathname === '/' && !session?.user) {
		redirect(303, '/login');
	}
};