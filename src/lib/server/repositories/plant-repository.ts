import { and, asc, desc, eq, like, or } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	plantSpecies,
	plantSpeciesImages,
	userPlantProgressPhotos,
	userPlants,
	wateringSchedules
} from '$lib/server/db/schema';

export type PlantSpeciesRow = typeof plantSpecies.$inferSelect;
export type UserPlantRow = typeof userPlants.$inferSelect;
export type WateringScheduleRow = typeof wateringSchedules.$inferSelect;

export const plantRepository = {
	async listApprovedSpecies(search?: string) {
		const conditions = [eq(plantSpecies.moderationStatus, 'approved')];
		if (search?.trim()) {
			const term = `%${search.trim()}%`;
			conditions.push(or(like(plantSpecies.name, term), like(plantSpecies.scientificName, term))!);
		}

		return db
			.select()
			.from(plantSpecies)
			.where(and(...conditions))
			.orderBy(asc(plantSpecies.name));
	},

	async findSpeciesById(id: string) {
		const [row] = await db.select().from(plantSpecies).where(eq(plantSpecies.id, id)).limit(1);
		return row ?? null;
	},

	async createSpecies(input: {
		name: string;
		scientificName?: string | null;
		description?: string | null;
		careTips?: string | null;
		recommendedWateringIntervalDays: number;
		recommendedFertilizingIntervalDays: number;
		lightRequirement: PlantSpeciesRow['lightRequirement'];
		humidityPreference?: string;
		createdByUserId: string;
		moderationStatus?: PlantSpeciesRow['moderationStatus'];
		isSystem?: boolean;
	}) {
		const id = crypto.randomUUID();
		await db.insert(plantSpecies).values({
			id,
			name: input.name,
			scientificName: input.scientificName ?? null,
			description: input.description ?? null,
			careTips: input.careTips ?? null,
			recommendedWateringIntervalDays: input.recommendedWateringIntervalDays,
			recommendedFertilizingIntervalDays: input.recommendedFertilizingIntervalDays,
			lightRequirement: input.lightRequirement,
			humidityPreference: input.humidityPreference ?? 'moderate',
			createdByUserId: input.createdByUserId,
			moderationStatus: input.moderationStatus ?? 'pending',
			isSystem: input.isSystem ?? false
		});
		return id;
	},

	async getPrimarySpeciesImageId(speciesId: string) {
		const [row] = await db
			.select({ id: plantSpeciesImages.id })
			.from(plantSpeciesImages)
			.where(eq(plantSpeciesImages.plantSpeciesId, speciesId))
			.orderBy(desc(plantSpeciesImages.isPrimary), asc(plantSpeciesImages.sortOrder))
			.limit(1);
		return row?.id ?? null;
	},

	async listSpeciesImages(speciesId: string) {
		return db
			.select({
				id: plantSpeciesImages.id,
				mimeType: plantSpeciesImages.mimeType,
				caption: plantSpeciesImages.caption,
				isPrimary: plantSpeciesImages.isPrimary
			})
			.from(plantSpeciesImages)
			.where(eq(plantSpeciesImages.plantSpeciesId, speciesId))
			.orderBy(desc(plantSpeciesImages.isPrimary), asc(plantSpeciesImages.sortOrder));
	},

	async createSpeciesImage(input: {
		plantSpeciesId: string;
		imageData: Buffer;
		mimeType: string;
		uploadedByUserId: string;
		isPrimary?: boolean;
		caption?: string | null;
	}) {
		const id = crypto.randomUUID();
		await db.insert(plantSpeciesImages).values({
			id,
			plantSpeciesId: input.plantSpeciesId,
			imageData: input.imageData,
			mimeType: input.mimeType,
			uploadedByUserId: input.uploadedByUserId,
			isPrimary: input.isPrimary ?? true,
			caption: input.caption ?? null
		});
		return id;
	},

	async getSpeciesImageById(id: string) {
		const [row] = await db
			.select({
				imageData: plantSpeciesImages.imageData,
				mimeType: plantSpeciesImages.mimeType
			})
			.from(plantSpeciesImages)
			.where(eq(plantSpeciesImages.id, id))
			.limit(1);
		return row ?? null;
	},

	async listUserPlants(userId: string) {
		return db
			.select({
				plant: userPlants,
				species: plantSpecies,
				schedule: wateringSchedules
			})
			.from(userPlants)
			.innerJoin(plantSpecies, eq(userPlants.plantSpeciesId, plantSpecies.id))
			.leftJoin(wateringSchedules, eq(wateringSchedules.userPlantId, userPlants.id))
			.where(eq(userPlants.userId, userId))
			.orderBy(desc(userPlants.createdAt));
	},

	async findUserPlantById(id: string, userId?: string) {
		const conditions = [eq(userPlants.id, id)];
		if (userId) conditions.push(eq(userPlants.userId, userId));

		const [row] = await db
			.select({
				plant: userPlants,
				species: plantSpecies,
				schedule: wateringSchedules
			})
			.from(userPlants)
			.innerJoin(plantSpecies, eq(userPlants.plantSpeciesId, plantSpecies.id))
			.leftJoin(wateringSchedules, eq(wateringSchedules.userPlantId, userPlants.id))
			.where(and(...conditions))
			.limit(1);
		return row ?? null;
	},

	async createUserPlant(input: {
		userId: string;
		plantSpeciesId: string;
		nickname: string;
		coverImage?: Buffer | null;
		coverMimeType?: string | null;
		location?: string | null;
		notes?: string | null;
	}) {
		const id = crypto.randomUUID();
		await db.insert(userPlants).values({
			id,
			userId: input.userId,
			plantSpeciesId: input.plantSpeciesId,
			nickname: input.nickname,
			coverImage: input.coverImage ?? null,
			coverMimeType: input.coverMimeType ?? null,
			location: input.location ?? null,
			notes: input.notes ?? null
		});
		return id;
	},

	async updateUserPlantCover(id: string, coverImage: Buffer, coverMimeType: string) {
		await db
			.update(userPlants)
			.set({ coverImage, coverMimeType, updatedAt: new Date() })
			.where(eq(userPlants.id, id));
	},

	async getUserPlantCover(id: string) {
		const [row] = await db
			.select({
				coverImage: userPlants.coverImage,
				coverMimeType: userPlants.coverMimeType
			})
			.from(userPlants)
			.where(eq(userPlants.id, id))
			.limit(1);
		return row ?? null;
	},

	async listProgressPhotos(userPlantId: string) {
		return db
			.select({
				id: userPlantProgressPhotos.id,
				mimeType: userPlantProgressPhotos.mimeType,
				caption: userPlantProgressPhotos.caption,
				takenAt: userPlantProgressPhotos.takenAt,
				createdAt: userPlantProgressPhotos.createdAt
			})
			.from(userPlantProgressPhotos)
			.where(eq(userPlantProgressPhotos.userPlantId, userPlantId))
			.orderBy(desc(userPlantProgressPhotos.takenAt));
	},

	async createProgressPhoto(input: {
		userPlantId: string;
		photoData: Buffer;
		mimeType: string;
		caption?: string | null;
		takenAt?: Date;
	}) {
		const id = crypto.randomUUID();
		await db.insert(userPlantProgressPhotos).values({
			id,
			userPlantId: input.userPlantId,
			photoData: input.photoData,
			mimeType: input.mimeType,
			caption: input.caption ?? null,
			takenAt: input.takenAt ?? new Date()
		});
		return id;
	},

	async getProgressPhotoById(id: string) {
		const [row] = await db
			.select({
				photoData: userPlantProgressPhotos.photoData,
				mimeType: userPlantProgressPhotos.mimeType
			})
			.from(userPlantProgressPhotos)
			.where(eq(userPlantProgressPhotos.id, id))
			.limit(1);
		return row ?? null;
	}
};