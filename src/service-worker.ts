/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
self.skipWaiting();
clientsClaim();

interface PushPayload {
	title?: string;
	body?: string;
	url?: string;
	icon?: string;
}

self.addEventListener('push', (event) => {
	if (!event.data) return;

	let payload: PushPayload = {};
	try {
		payload = event.data.json() as PushPayload;
	} catch {
		payload = { body: event.data.text() };
	}

	const title = payload.title ?? 'LeafBuddy';
	const options: NotificationOptions = {
		body: payload.body ?? '',
		icon: payload.icon ?? '/pwa-192x192.png',
		badge: '/pwa-192x192.png',
		data: { url: payload.url ?? '/' }
	};

	event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();

	const url = (event.notification.data?.url as string | undefined) ?? '/';

	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			for (const client of clientList) {
				if (client.url.includes(url) && 'focus' in client) {
					return client.focus();
				}
			}

			if (self.clients.openWindow) {
				return self.clients.openWindow(url);
			}
		})
	);
});