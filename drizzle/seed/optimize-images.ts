import 'dotenv/config';
import sharp from 'sharp';
import { eq } from 'drizzle-orm';
import { db } from '../../src/lib/server/db/index.js';
import { plantSpeciesImages } from '../../src/lib/server/db/schema.js';

async function formatBytes(bytes: number) {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function optimizeImages() {
	console.log('Starting image optimization process...');

	const images = await db.select().from(plantSpeciesImages);
	console.log(`Found ${images.length} images to process.`);

	let processed = 0;
	let skipped = 0;
	let failed = 0;
	let totalSavedBytes = 0;

	for (const image of images) {
		console.log(`\nProcessing image ID: ${image.id}`);

		if (!image.imageData) {
			console.log(`Skipping - No image data found`);
			skipped++;
			continue;
		}

		try {
			const originalBuffer = image.imageData;
			const originalSize = originalBuffer.length;

			// Skip if it's already a very small webp (likely already optimized)
			if (image.mimeType === 'image/webp' && originalSize < 100 * 1024) {
				console.log(`Skipping - Image is already an optimized WebP (${await formatBytes(originalSize)})`);
				skipped++;
				continue;
			}

			console.log(`Original size: ${await formatBytes(originalSize)}`);

			// Optimize using sharp
			const optimizedBuffer = await sharp(originalBuffer)
				.resize({
					width: 800,
					withoutEnlargement: true // Don't enlarge if image is already smaller than 800px
				})
				.webp({ quality: 80 })
				.toBuffer();

			const optimizedSize = optimizedBuffer.length;
			console.log(`Optimized size: ${await formatBytes(optimizedSize)}`);

			const savings = originalSize - optimizedSize;
			
			if (savings > 0) {
				const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
				console.log(`Saved ${await formatBytes(savings)} (${savingsPercent}%)`);
				
				// Update database
				await db
					.update(plantSpeciesImages)
					.set({
						imageData: optimizedBuffer as any,
						mimeType: 'image/webp'
					})
					.where(eq(plantSpeciesImages.id, image.id));
				
				totalSavedBytes += savings;
				processed++;
			} else {
				console.log(`Skipping - Optimization did not reduce file size`);
				// It's possible the original was highly compressed. 
				// We still might want to convert to webp if it wasn't webp, but to be safe we leave it alone if it's larger.
				skipped++;
			}
		} catch (error) {
			console.error(`Error processing image ${image.id}:`, error);
			failed++;
		}
	}

	console.log(`\n--- Optimization Complete ---`);
	console.log(`Successfully processed: ${processed} images`);
	console.log(`Skipped: ${skipped} images`);
	console.log(`Failed: ${failed} images`);
	console.log(`Total space saved: ${await formatBytes(totalSavedBytes)}`);

	process.exit(0);
}

optimizeImages().catch((err) => {
	console.error('Fatal error during optimization:', err);
	process.exit(1);
});
