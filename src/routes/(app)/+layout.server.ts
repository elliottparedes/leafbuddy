import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { notificationService } from '$lib/server/services/notification-service';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		redirect(303, '/login');
	}

	const unreadCount = await notificationService.getUnreadCount(session.user.id);

	return {
		session,
		unreadCount
	};
};