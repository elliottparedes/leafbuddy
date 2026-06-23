import 'dotenv/config';
import { eq, isNull, notInArray } from 'drizzle-orm';
import { db } from '../../src/lib/server/db/index.js';
import { plantSpecies, plantSpeciesImages } from '../../src/lib/server/db/schema.js';

async function fetchWikipediaImage(scientificName: string, commonName: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
	// First try scientific name, then common name
	const queries = [scientificName, commonName].filter(Boolean);

	for (const query of queries) {
		try {
			const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(query)}`;
			const headers = { 'User-Agent': 'LeafBuddySeedScript/1.0 (hello@leafbuddy.app)' };
			const searchRes = await fetch(searchUrl, { headers });
			const searchData = await searchRes.json();
			
			const pages = searchData.query?.pages;
			if (!pages) continue;

			const pageId = Object.keys(pages)[0];
			if (pageId === '-1') continue;

			const imageUrl = pages[pageId]?.original?.source;
			if (!imageUrl) continue;

			console.log(`Found image for ${query}: ${imageUrl}`);

			const imageRes = await fetch(imageUrl, { headers });
			if (!imageRes.ok) {
				console.error(`Failed to download image from ${imageUrl}: ${imageRes.statusText}`);
				continue;
			}

			const arrayBuffer = await imageRes.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			
			// Simple mime type detection from URL extension or response headers
			const contentType = imageRes.headers.get('content-type');
			const mimeType = contentType || 'image/jpeg'; // Default fallback

			return { buffer, mimeType };
		} catch (error) {
			console.error(`Error fetching Wikipedia image for ${query}:`, error);
		}
	}

	return null;
}

async function seedImages() {
	console.log('Starting image seeding process...');

	// Find species that already have primary images
	const speciesWithImages = await db
		.select({ id: plantSpeciesImages.plantSpeciesId })
		.from(plantSpeciesImages);
	
	const speciesIdsWithImages = speciesWithImages.map(row => row.id).filter(id => id !== null);

	// Fetch plants missing images
	let plantsToProcess;
	if (speciesIdsWithImages.length > 0) {
		plantsToProcess = await db
			.select()
			.from(plantSpecies)
			.where(notInArray(plantSpecies.id, speciesIdsWithImages as string[]));
	} else {
		plantsToProcess = await db.select().from(plantSpecies);
	}

	console.log(`Found ${plantsToProcess.length} plants missing images.`);

	let inserted = 0;
	let failed = 0;

	for (const plant of plantsToProcess) {
		console.log(`\nProcessing: ${plant.name} (${plant.scientificName})`);
		
		const image = await fetchWikipediaImage(plant.scientificName || '', plant.name);
		
		if (image) {
			try {
				await db.insert(plantSpeciesImages).values({
					plantSpeciesId: plant.id,
					imageData: image.buffer as any, // Cast due to custom type setup in schema
					mimeType: image.mimeType,
					caption: plant.name,
					isPrimary: true,
					sortOrder: 0,
					uploadedByUserId: null
				});
				inserted++;
				console.log(`Successfully uploaded image for ${plant.name}`);
			} catch (error) {
				console.error(`Failed to insert image for ${plant.name} into database:`, error);
				failed++;
			}
		} else {
			console.log(`No image found for ${plant.name}. Skipping.`);
			failed++;
		}
		
		// Add a delay to be polite to Wikipedia API and avoid rate limits
		await new Promise(resolve => setTimeout(resolve, 1500));
	}

	console.log(`\n--- Seeding Complete ---`);
	console.log(`Successfully added images for ${inserted} plants.`);
	console.log(`Failed or skipped ${failed} plants.`);
	
	process.exit(0);
}

seedImages().catch((err) => {
	console.error('Fatal error during seeding:', err);
	process.exit(1);
});
