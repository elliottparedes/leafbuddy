import { json } from '@sveltejs/kit';
import { client } from '$lib/server/logger';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const message = typeof body.message === 'string' ? body.message : JSON.stringify(body);
    const level = body.level || 'CLIENT';
    
    // Only log client stuff in dev for now, or always
    if (process.env.NODE_ENV === 'development' || level === 'CLIENT') {
      await client(`[FRONTEND] ${message}`);
    }
    
    return json({ success: true });
  } catch (e) {
    // Don't fail the client on log errors
    return json({ success: false }, { status: 200 });
  }
};
