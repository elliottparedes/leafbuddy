import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import { getDatabaseUrl } from './connection';

let pool: mysql.Pool | null = null;

function getPool() {
	if (!pool) {
		pool = mysql.createPool(getDatabaseUrl());
	}
	return pool;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
	get(_target, prop) {
		const client = drizzle(getPool(), { schema, mode: 'default' });
		const value = client[prop as keyof typeof client];
		return typeof value === 'function' ? value.bind(client) : value;
	}
});