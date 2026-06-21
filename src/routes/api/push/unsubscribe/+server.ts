import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { notificationService } from '$lib/server/services/notification-service';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		error(401, 'Unauthorized');
	}

	const body = await request.json();
	const endpoint = body?.endpoint?.toString();
	if (!endpoint) {
		error(400, 'Endpoint is required');
	}

	await notificationService.removePushSubscription(session.user.id, endpoint);
	return json({ ok: true });
};