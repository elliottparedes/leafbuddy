import { SvelteKitAuth, type SvelteKitAuthConfig } from '@auth/sveltekit';
import Credentials from '@auth/core/providers/credentials';
import { compare } from 'bcryptjs';
import { env } from '$env/dynamic/private';
import { userRepository } from '$lib/server/repositories/user-repository';

export const authConfig: SvelteKitAuthConfig = {
	providers: [
		Credentials({
			name: 'credentials',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' }
			},
			async authorize(credentials) {
				const email = credentials?.email?.toString().trim().toLowerCase();
				const password = credentials?.password?.toString();
				if (!email || !password) return null;

				const user = await userRepository.findByEmail(email);
				if (!user?.passwordHash) return null;

				const valid = await compare(password, user.passwordHash);
				if (!valid) return null;

				return {
					id: user.id,
					email: user.email,
					name: user.name ?? user.email
				};
			}
		})
	],
	session: { strategy: 'jwt' },
	callbacks: {
		jwt({ token, user }) {
			if (user?.id) token.sub = user.id;
			return token;
		},
		session({ session, token }) {
			if (session.user && token.sub) {
				session.user.id = token.sub;
			}
			return session;
		}
	},
	secret: env.AUTH_SECRET,
	trustHost: true,
	basePath: '/auth',
	pages: {
		signIn: '/login'
	}
};

export const { handle, signIn, signOut } = SvelteKitAuth(authConfig);