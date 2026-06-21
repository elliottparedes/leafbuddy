/// <reference types="vite-plugin-pwa/client" />

import type { DefaultSession } from '@auth/core/types';

declare global {
	namespace App {
		interface Locals {
			auth(): Promise<import('@auth/core/types').Session | null>;
			getSession(): Promise<import('@auth/core/types').Session | null>;
		}
	}
}

declare module '@auth/core/types' {
	interface Session {
		user: DefaultSession['user'] & {
			id: string;
		};
	}
}

export {};