import 'dotenv/config';
import fs from 'fs';
import { eq } from 'drizzle-orm';
import { db } from '../../src/lib/server/db/index.js';
import { plantSpecies, plantSpeciesImages } from '../../src/lib/server/db/schema.js';

const imagesToUpload = [
	{ name: 'ZZ Plant', path: String.raw`C:\Users\Ellio\.gemini\antigravity\brain\67271ccb-a3b2-47be-aead-1298b8109e70\zz_plant_1782178516276.png` },
	{ name: 'Aloe Vera', path: String.raw`C:\Users\Ellio\.gemini\antigravity\brain\67271ccb-a3b2-47be-aead-1298b8109e70\aloe_vera_1782178524926.png` },
	{ name: 'African Violet', path: String.raw`C:\Users\Ellio\.gemini\antigravity\brain\67271ccb-a3b2-47be-aead-1298b8109e70\african_violet_1782178532159.png` },
	{ name: 'Dracaena Marginata', path: String.raw`C:\Users\Ellio\.gemini\antigravity\brain\67271ccb-a3b2-47be-aead-1298b8109e70\dracaena_marginata_1782178542217.png` },
	{ name: 'Cilantro', path: String.raw`C:\Users\Ellio\.gemini\antigravity\brain\67271ccb-a3b2-47be-aead-1298b8109e70\cilantro_1782178553012.png` },
	{ name: 'Mint', path: String.raw`C:\Users\Ellio\.gemini\antigravity\brain\67271ccb-a3b2-47be-aead-1298b8109e70\mint_1782178564216.png` },
	{ name: 'Sunflower', path: String.raw`C:\Users\Ellio\.gemini\antigravity\brain\67271ccb-a3b2-47be-aead-1298b8109e70\sunflower_1782178571176.png` }
];

async function seedLocal() {
	console.log('Uploading AI generated images for the remaining plants...');

	let inserted = 0;

	for (const img of imagesToUpload) {
		const plant = await db.select().from(plantSpecies).where(eq(plantSpecies.name, img.name)).limit(1);
		if (plant.length === 0) {
			console.log(`Could not find plant with name ${img.name} in the database.`);
			continue;
		}

		try {
			const buffer = fs.readFileSync(img.path);
			await db.insert(plantSpeciesImages).values({
				plantSpeciesId: plant[0].id,
				imageData: buffer as any,
				mimeType: 'image/png',
				caption: plant[0].name,
				isPrimary: true,
				sortOrder: 0,
				uploadedByUserId: null
			});
			console.log(`Successfully uploaded image for ${img.name}`);
			inserted++;
		} catch (error) {
			console.error(`Failed to insert image for ${img.name}:`, error);
		}
	}

	console.log(`Finished uploading ${inserted} images.`);
	process.exit(0);
}

seedLocal().catch(console.error);
