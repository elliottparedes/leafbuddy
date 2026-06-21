import 'dotenv/config';

/** Resolves the MySQL URL from environment (SvelteKit + drizzle/seed scripts). */
export function getDatabaseUrl(): string {
	const env = process.env;

	if (env.DATABASE_URL) {
		return env.DATABASE_URL;
	}

	const { MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } = env;
	if (MYSQL_HOST && MYSQL_USER && MYSQL_PASSWORD && MYSQL_DATABASE) {
		const port = MYSQL_PORT ?? '3306';
		const user = encodeURIComponent(MYSQL_USER);
		const password = encodeURIComponent(MYSQL_PASSWORD);
		return `mysql://${user}:${password}@${MYSQL_HOST}:${port}/${MYSQL_DATABASE}`;
	}

	throw new Error(
		'DATABASE_URL is not set. Add it to .env or set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE.'
	);
}