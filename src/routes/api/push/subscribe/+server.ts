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
	const p256dh = body?.keys?.p256dh?.toString();
	const auth = body?.keys?.auth?.toString();

	if (!endpoint || !p256dh || !auth) {
		error(400, 'Invalid subscription payload');
	}

	await notificationService.savePushSubscription(session.user.id, {
		endpoint,
		keys: { p256dh, auth }
	});

	return json({ ok: true });
};