import { sequence } from '@sveltejs/kit/hooks';
import { handle as authHandle } from './auth';
import { log } from '$lib/server/logger';

export const handle = sequence(async ({ event, resolve }) => {
  const start = Date.now();
  const response = await resolve(event);
  const duration = Date.now() - start;
  
  await log(`${event.request.method} ${event.url.pathname} - ${response.status} (${duration}ms)`);
  
  return response;
}, authHandle);
