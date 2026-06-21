import { fail, isRedirect, redirect } from '@sveltejs/kit';
import { CredentialsSignin } from '@auth/sveltekit';
import type { Actions, PageServerLoad } from './$types';
import { signIn } from '../../auth';

function isInvalidCredentials(error: unknown): boolean {
	if (error instanceof CredentialsSignin) return true;
	return error instanceof Error && 'type' in error && error.type === 'CredentialsSignin';
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = await locals.auth();
	if (session?.user) redirect(303, '/');
	return { registered: url.searchParams.get('registered') === '1' };
};

export const actions: Actions = {
	default: async (event) => {
		try {
			await signIn(event);
		} catch (error) {
			if (isRedirect(error)) throw error;
			if (isInvalidCredentials(error)) {
				return fail(400, { message: 'Invalid email or password.' });
			}
			throw error;
		}
	}
};