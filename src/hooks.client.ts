import { dev } from '$app/environment';

/** Stale PWA service workers cache old JS and break hydration + HMR in dev. */
if (dev && 'serviceWorker' in navigator) {
	void navigator.serviceWorker.getRegistrations().then((registrations) => {
		for (const registration of registrations) {
			void registration.unregister();
		}
	});
}