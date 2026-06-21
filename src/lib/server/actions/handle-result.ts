import { fail } from '@sveltejs/kit';
import type { ServiceResult } from '$lib/server/services/result';

/** Maps service-layer validation errors to SvelteKit `fail` responses. */
export function failIfError<T>(result: ServiceResult<T>) {
	if (!result.ok) {
		return fail(400, { message: result.message });
	}
	return null;
}

/** Use after `failIfError` when TypeScript needs narrowing to access `data`. */
export function unwrapResult<T>(result: ServiceResult<T>): T {
	if (!result.ok) {
		throw new Error(result.message);
	}
	return result.data;
}