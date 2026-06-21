import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { plantRepository } from '$lib/server/repositories/plant-repository';

export const GET: RequestHandler = async ({ params }) => {
	const cover = await plantRepository.getUserPlantCover(params.id);
	if (!cover?.coverImage) {
		error(404, 'Image not found');
	}

	return new Response(new Uint8Array(cover.coverImage), {
		headers: {
			'Content-Type': cover.coverMimeType ?? 'image/jpeg',
			'Cache-Control': 'private, max-age=3600'
		}
	});
};