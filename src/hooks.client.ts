import { dev } from '$app/environment';

/** Stale PWA service workers cache old JS and break hydration + HMR in dev. */
if (dev && 'serviceWorker' in navigator) {
	void navigator.serviceWorker.getRegistrations().then((registrations) => {
		for (const registration of registrations) {
			void registration.unregister();
		}
	});
}

// Handle messages from service worker (e.g., mark as watered from notification)
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.addEventListener('message', (event) => {
		if (event.data && event.data.type === 'MARK_WATERED') {
			const plantId = event.data.plantId;
			if (plantId) {
				// Create a form and submit to mark as watered
				const form = document.createElement('form');
				form.method = 'POST';
				form.action = `/?/markWatered`;
				
				const input = document.createElement('input');
				input.type = 'hidden';
				input.name = 'id';
				input.value = plantId;
				form.appendChild(input);
				
				document.body.appendChild(form);
				form.submit();
				document.body.removeChild(form);
			}
		}
	});
}