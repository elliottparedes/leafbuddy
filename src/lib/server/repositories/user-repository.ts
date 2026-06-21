import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';

export const userRepository = {
	async findById(id: string) {
		const [row] = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email
			})
			.from(users)
			.where(eq(users.id, id))
			.limit(1);
		return row ?? null;
	},

	async findByEmail(email: string) {
		const [row] = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				passwordHash: users.passwordHash
			})
			.from(users)
			.where(eq(users.email, email))
			.limit(1);
		return row ?? null;
	},

	async emailExists(email: string): Promise<boolean> {
		const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
		return Boolean(row);
	},

	async create(input: { name: string; email: string; passwordHash: string }) {
		const id = crypto.randomUUID();
		await db.insert(users).values({
			id,
			name: input.name,
			email: input.email,
			passwordHash: input.passwordHash
		});
		return id;
	}
};