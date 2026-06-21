import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { runWateringRemindersJob } from '$lib/server/jobs/watering-reminders';

export const POST: RequestHandler = async ({ request }) => {
	const cronSecret = env.CRON_SECRET;
	if (cronSecret) {
		const auth = request.headers.get('authorization');
		if (auth !== `Bearer ${cronSecret}`) {
			return json({ ok: false, message: 'Unauthorized' }, { status: 401 });
		}
	}

	const result = await runWateringRemindersJob();
	return json({ ok: true, ...result });
};