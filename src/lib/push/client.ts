import { browser } from '$app/environment';
import { PUBLIC_VAPID_PUBLIC_KEY } from '$env/static/public';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const raw = atob(base64);
	const output = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i += 1) {
		output[i] = raw.charCodeAt(i);
	}
	return output;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
	if (!browser || !('serviceWorker' in navigator)) {
		throw new Error('Service workers are not supported in this browser.');
	}

	const existing = await navigator.serviceWorker.getRegistration();
	if (existing) return existing;

	await navigator.serviceWorker.register('/sw.js');
	return navigator.serviceWorker.ready;
}

export function isPushSupported(): boolean {
	return browser && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function getPushPermission(): Promise<NotificationPermission> {
	if (!isPushSupported()) return 'denied';
	return Notification.permission;
}

export async function subscribeToPush(): Promise<PushSubscription> {
	if (!PUBLIC_VAPID_PUBLIC_KEY) {
		throw new Error('PUBLIC_VAPID_PUBLIC_KEY is not configured.');
	}

	const permission = await Notification.requestPermission();
	if (permission !== 'granted') {
		throw new Error('Notification permission was not granted.');
	}

	const registration = await getRegistration();
	const existing = await registration.pushManager.getSubscription();
	if (existing) return existing;

	return registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_PUBLIC_KEY) as BufferSource
	});
}

export async function unsubscribeFromPush(): Promise<void> {
	if (!isPushSupported()) return;
	const registration = await navigator.serviceWorker.getRegistration();
	const subscription = await registration?.pushManager.getSubscription();
	if (subscription) {
		await subscription.unsubscribe();
	}
}

export async function syncPushSubscription(action: 'subscribe' | 'unsubscribe') {
	if (action === 'unsubscribe') {
		const registration = await navigator.serviceWorker.getRegistration();
		const subscription = await registration?.pushManager.getSubscription();
		if (subscription) {
			await fetch('/api/push/unsubscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ endpoint: subscription.endpoint })
			});
			await subscription.unsubscribe();
		}
		return;
	}

	const subscription = await subscribeToPush();
	const json = subscription.toJSON();
	if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
		throw new Error('Invalid push subscription.');
	}

	await fetch('/api/push/subscribe', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			endpoint: json.endpoint,
			keys: {
				p256dh: json.keys.p256dh,
				auth: json.keys.auth
			}
		})
	});
}