import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../../src/lib/server/db/index.js';
import { plantSpecies } from '../../src/lib/server/db/schema.js';

type SeedPlant = {
	name: string;
	scientificName: string;
	description: string;
	careTips: string;
	recommendedWateringIntervalDays: number;
	recommendedFertilizingIntervalDays: number;
	lightRequirement: 'low' | 'medium' | 'bright_indirect' | 'direct';
	humidityPreference: string;
};

const catalog: SeedPlant[] = [
	{
		name: 'Monstera',
		scientificName: 'Monstera deliciosa',
		description:
			'A popular tropical houseplant known for its large, split leaves. Native to Central American rainforests.',
		careTips:
			'Allow the top 2 inches of soil to dry between waterings. Wipe leaves monthly to remove dust. Provide a moss pole for climbing support. Avoid direct afternoon sun.',
		recommendedWateringIntervalDays: 7,
		recommendedFertilizingIntervalDays: 30,
		lightRequirement: 'bright_indirect',
		humidityPreference: 'high'
	},
	{
		name: 'Snake Plant',
		scientificName: 'Dracaena trifasciata',
		description:
			'An extremely hardy succulent with upright, sword-like leaves. Tolerates neglect and low light exceptionally well.',
		careTips:
			'Water sparingly — overwatering is the main cause of decline. Let soil dry completely between waterings. Thrives in most indoor conditions. Rotate occasionally for even growth.',
		recommendedWateringIntervalDays: 14,
		recommendedFertilizingIntervalDays: 60,
		lightRequirement: 'low',
		humidityPreference: 'low'
	},
	{
		name: 'Pothos',
		scientificName: 'Epipremnum aureum',
		description:
			'A fast-growing trailing vine with heart-shaped leaves. One of the easiest houseplants for beginners.',
		careTips:
			'Water when the top inch of soil feels dry. Trim leggy vines to encourage bushier growth. Tolerates low light but variegation is brighter with more light. Propagates easily in water.',
		recommendedWateringIntervalDays: 7,
		recommendedFertilizingIntervalDays: 30,
		lightRequirement: 'medium',
		humidityPreference: 'moderate'
	},
	{
		name: 'Peace Lily',
		scientificName: 'Spathiphyllum wallisii',
		description:
			'An elegant plant with glossy green leaves and white spathe flowers. Excellent air purifier and a reliable bloomer indoors.',
		careTips:
			'Keep soil consistently moist but not waterlogged. Drooping leaves signal thirst. Prefers warm, humid conditions. Brown leaf tips often indicate low humidity or fluoride in tap water.',
		recommendedWateringIntervalDays: 5,
		recommendedFertilizingIntervalDays: 30,
		lightRequirement: 'medium',
		humidityPreference: 'high'
	},
	{
		name: 'Fiddle Leaf Fig',
		scientificName: 'Ficus lyrata',
		description:
			'A statement plant with large, violin-shaped leaves. Popular in modern interiors but requires consistent care.',
		careTips:
			'Water when the top 2 inches of soil are dry. Avoid moving the plant frequently — it dislikes drafts and relocation. Dust leaves regularly. Bright, indirect light is essential for healthy growth.',
		recommendedWateringIntervalDays: 7,
		recommendedFertilizingIntervalDays: 30,
		lightRequirement: 'bright_indirect',
		humidityPreference: 'moderate'
	}
];

async function seed() {
	let inserted = 0;

	for (const item of catalog) {
		const existing = await db
			.select({ id: plantSpecies.id })
			.from(plantSpecies)
			.where(eq(plantSpecies.name, item.name))
			.limit(1);

		if (existing.length > 0) continue;

		await db.insert(plantSpecies).values({
			name: item.name,
			scientificName: item.scientificName,
			description: item.description,
			careTips: item.careTips,
			recommendedWateringIntervalDays: item.recommendedWateringIntervalDays,
			recommendedFertilizingIntervalDays: item.recommendedFertilizingIntervalDays,
			lightRequirement: item.lightRequirement,
			humidityPreference: item.humidityPreference,
			isSystem: true,
			createdByUserId: null,
			moderationStatus: 'approved',
			moderationNotes: null
		});
		inserted++;
	}

	console.log(`Seed complete: ${inserted} new plant species (${catalog.length} in catalog).`);
	process.exit(0);
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});