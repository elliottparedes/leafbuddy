self.addEventListener('push', (event) => {
	let data = { 
		title: 'LeafBuddy', 
		body: 'You have a plant care reminder.',
		url: '/',
		actions: [],
		tag: 'leafbuddy-default',
		requireInteraction: false,
		renotify: false
	};
	try {
		if (event.data) {
			data = { ...data, ...event.data.json() };
		}
	} catch {
		// ignore malformed payloads
	}

	const options = {
		body: data.body,
		icon: '/pwa-192x192.png',
		badge: '/pwa-192x192.png',
		tag: data.tag || 'leafbuddy',
		requireInteraction: data.requireInteraction || false,
		renotify: data.renotify || false,
		vibrate: [200, 100, 200],
		actions: data.actions || [],
		data: { 
			url: data.url || '/',
			plantId: data.plantId,
			action: data.action
		}
	};

	event.waitUntil(
		self.registration.showNotification(data.title, options)
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	
	const action = event.action;
	const data = event.notification.data || {};
	const plantId = data.plantId;
	
	// Handle action button clicks
	if (action === 'mark-watered' && plantId) {
		// Send message to client to mark as watered
		event.waitUntil(
			markPlantWatered(plantId).then(() => {
				// Focus or open the app
				return focusOrOpenWindow('/');
			})
		);
	} else if (action === 'view' && plantId) {
		event.waitUntil(
			focusOrOpenWindow(`/my-plants/${plantId}`)
		);
	} else if (action === 'view-all') {
		event.waitUntil(
			focusOrOpenWindow('/')
		);
	} else {
		// Default: open the URL
		event.waitUntil(
			focusOrOpenWindow(data.url || '/')
		);
	}
});

// Helper to focus existing window or open new one
async function focusOrOpenWindow(url) {
	const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
	
	// Try to focus an existing window
	for (const client of windowClients) {
		if (client.url.includes(self.registration.scope)) {
			await client.focus();
			await client.navigate(url);
			return client;
		}
	}
	
	// Open new window if none found
	return self.clients.openWindow(url);
}

// Helper to mark a plant as watered via API
async function markPlantWatered(plantId) {
	try {
		// Get all window clients
		const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
		
		// Try to use a visible client to make the request
		for (const client of clients) {
			if (client.visibilityState === 'visible') {
				// Send a message to the client to mark as watered
				client.postMessage({
					type: 'MARK_WATERED',
					plantId: plantId
				});
				return;
			}
		}
		
		// If no visible client, store for later sync
		// Note: Background sync would require additional setup
	} catch (error) {
		console.error('Failed to mark plant as watered:', error);
	}
}

// Listen for messages from the main app
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});