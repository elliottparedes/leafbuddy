import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { notificationRepository } from '$lib/server/repositories/notification-repository';
import { sendPushNotification } from '$lib/server/push';
import { notificationService } from '$lib/server/services/notification-service';

async function sendTestPushToUser(userId: string) {
	const title = '🧪 LeafBuddy Test Push';
	const body = 'If you received this, push notifications are working correctly on prod!';

	// Also create an in-app notification record
	await notificationService.create({
		userId,
		type: 'system',
		title,
		body
	});

	// For testing, we send to any active subscriptions regardless of the pushEnabled toggle.
	// This makes it easier to verify the end-to-end push pipeline.
	const subscriptions = await notificationRepository.listPushSubscriptionsForUser(userId);

	let sent = 0;
	const errors: string[] = [];

	for (const sub of subscriptions) {
		try {
			await sendPushNotification(
				{
					endpoint: sub.endpoint,
					p256dh: sub.p256dh,
					auth: sub.auth
				},
				{
					title,
					body,
					url: '/notifications'
				}
			);
			sent += 1;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			errors.push(message);
		}
	}

	return {
		sent,
		subscriptions: subscriptions.length,
		errors: errors.length > 0 ? errors : undefined
	};
}

export const GET: RequestHandler = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		error(401, 'You must be logged in to test push notifications');
	}

	const result = await sendTestPushToUser(session.user.id);
	return json({
		ok: true,
		message: 'Test notification triggered',
		...result
	});
};

export const POST: RequestHandler = GET;
