import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { notificationService } from '$lib/server/services/notification-service';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		redirect(303, '/login');
	}

	const notifications = await notificationService.listForUser(session.user.id);
	const unreadCount = notifications.filter((n) => !n.readAt).length;

	return {
		session,
		unreadCount,
		notifications: notifications.map((n) => ({
			id: n.id,
			type: n.type,
			title: n.title,
			body: n.body,
			readAt: n.readAt,
			createdAt: n.createdAt,
			relatedUserPlantId: n.relatedUserPlantId
		}))
	};
};