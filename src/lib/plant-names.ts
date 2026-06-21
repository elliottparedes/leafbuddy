const ADJECTIVES = [
	'Chill',
	'Happy',
	'Lush',
	'Mighty',
	'Sunny',
	'Zen',
	'Brave',
	'Cozy',
	'Gentle',
	'Jolly',
	'Mellow',
	'Peppy',
	'Radiant',
	'Sleepy',
	'Spicy',
	'Sturdy',
	'Vivid',
	'Wise',
	'Breezy',
	'Dapper'
] as const;

const TITLES = [
	'Fern',
	'Succulent',
	'Leaf',
	'Sprout',
	'Buddy',
	'Pal',
	'Green',
	'Plant',
	'Frond',
	'Vine',
	'Bloom',
	'Seedling',
	'Shrub',
	'Herb',
	'Cactus',
	'Monstera',
	'Pothos',
	'Ficus',
	'Orchid',
	'Basil'
] as const;

function pickRandom<T>(items: readonly T[]): T {
	return items[Math.floor(Math.random() * items.length)];
}

/** Extract a short plant-type word from a species name for nickname generation. */
function speciesKeyword(speciesName: string): string {
	const cleaned = speciesName.trim();
	if (!cleaned) return pickRandom(TITLES);

	const words = cleaned.split(/\s+/);
	const last = words[words.length - 1];
	if (last.length >= 3) {
		return last.charAt(0).toUpperCase() + last.slice(1).toLowerCase();
	}
	return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

/** Generate a friendly nickname like "Chill Fern" or "Sir Succulent". */
export function suggestNickname(speciesName: string): string {
	const keyword = speciesKeyword(speciesName);
	const adjective = pickRandom(ADJECTIVES);

	if (Math.random() < 0.25) {
		return `Sir ${keyword}`;
	}
	if (Math.random() < 0.2) {
		return `Lady ${keyword}`;
	}

	return `${adjective} ${keyword}`;
}