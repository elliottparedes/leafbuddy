import webpush from 'web-push';
import { env } from '$env/dynamic/private';

let configured = false;

function ensureVapidConfigured() {
	if (configured) return;
	const publicKey = env.VAPID_PUBLIC_KEY;
	const privateKey = env.VAPID_PRIVATE_KEY;
	const subject = env.VAPID_SUBJECT ?? 'mailto:hello@leafbuddy.app';

	if (!publicKey || !privateKey) {
		throw new Error('VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set.');
	}

	webpush.setVapidDetails(subject, publicKey, privateKey);
	configured = true;
}

export type PushPayload = {
	title: string;
	body: string;
	url?: string;
	notificationId?: string;
	plantId?: string;
	actions?: Array<{ action: string; title: string }>;
	tag?: string;
	requireInteraction?: boolean;
	renotify?: boolean;
};

export async function sendPushNotification(
	subscription: { endpoint: string; p256dh: string; auth: string },
	payload: PushPayload
) {
	ensureVapidConfigured();

	const pushSubscription = {
		endpoint: subscription.endpoint,
		keys: {
			p256dh: subscription.p256dh,
			auth: subscription.auth
		}
	};

	await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
}