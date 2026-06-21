import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { plantRepository } from '$lib/server/repositories/plant-repository';

export const GET: RequestHandler = async ({ params }) => {
	const image = await plantRepository.getSpeciesImageById(params.id);
	if (!image?.imageData) {
		error(404, 'Image not found');
	}

	return new Response(new Uint8Array(image.imageData), {
		headers: {
			'Content-Type': image.mimeType,
			'Cache-Control': 'public, max-age=86400'
		}
	});
};