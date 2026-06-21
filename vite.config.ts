import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import type { ManifestOptions } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

const pwaManifest: Partial<ManifestOptions> = {
	name: 'LeafBuddy',
	short_name: 'LeafBuddy',
	description: 'Track and care for your plants',
	start_url: '/',
	scope: '/',
	display: 'standalone',
	theme_color: '#15803d',
	background_color: '#fbfdfb',
	icons: [
		{
			src: '/pwa-192x192.png',
			sizes: '192x192',
			type: 'image/png',
			purpose: 'any'
		},
		{
			src: '/pwa-512x512.png',
			sizes: '512x512',
			type: 'image/png',
			purpose: 'any'
		},
		{
			src: '/pwa-512x512.png',
			sizes: '512x512',
			type: 'image/png',
			purpose: 'maskable'
		}
	]
};

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }: { filename: string }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		}),
		// PWA only in production — dev service workers cache stale bundles and break hydration/HMR
		...(process.env.NODE_ENV === 'production'
			? [
					SvelteKitPWA({
						registerType: 'autoUpdate',
						strategies: 'injectManifest',
						srcDir: 'src',
						filename: 'service-worker.ts',
						manifest: pwaManifest,
						injectManifest: {
							globPatterns: ['**/*.{js,css,html,svg,woff2,ico,png,webmanifest}']
						},
						devOptions: {
							enabled: false
						}
					})
				]
			: [])
	]
});