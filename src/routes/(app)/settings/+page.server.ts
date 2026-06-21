import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { failIfError } from '$lib/server/actions/handle-result';
import { notificationService } from '$lib/server/services/notification-service';
import { signOut } from '../../../auth';

export const load: PageServerLoad = async ({ parent }) => {
	const { session } = await parent();
	const preferences = await notificationService.getPreferences(session.user!.id);

	return {
		preferences: {
			wateringDueEnabled: preferences.wateringDueEnabled,
			wateringReminderEnabled: preferences.wateringReminderEnabled,
			communityUpdateEnabled: preferences.communityUpdateEnabled,
			systemEnabled: preferences.systemEnabled,
			pushEnabled: preferences.pushEnabled
		}
	};
};

export const actions: Actions = {
	updatePreferences: async ({ request, locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, '/login');

		const result = await notificationService.updatePreferencesFromForm(
			session.user.id,
			await request.formData()
		);
		const err = failIfError(result);
		if (err) return err;
		return { success: true };
	},

	signOut: async (event) => {
		await signOut(event);
	}
};