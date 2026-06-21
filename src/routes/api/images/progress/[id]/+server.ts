import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { plantRepository } from '$lib/server/repositories/plant-repository';

export const GET: RequestHandler = async ({ params }) => {
	const photo = await plantRepository.getProgressPhotoById(params.id);
	if (!photo?.photoData) {
		error(404, 'Image not found');
	}

	return new Response(new Uint8Array(photo.photoData), {
		headers: {
			'Content-Type': photo.mimeType,
			'Cache-Control': 'private, max-age=3600'
		}
	});
};