import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { notificationService } from '$lib/server/services/notification-service';

export const load: PageServerLoad = async ({ parent }) => {
	const { session } = await parent();
	const notifications = await notificationService.listForUser(session.user!.id);

	return {
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

export const actions: Actions = {
	markRead: async ({ request, locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, '/login');

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (id) {
			await notificationService.markRead(id, session.user.id);
		}
	},

	markAllRead: async ({ locals }) => {
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, '/login');
		await notificationService.markAllRead(session.user.id);
	}
};