import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';
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

	async updateSpecies(id: string, input: {
		name?: string;
		scientificName?: string | null;
		description?: string | null;
		careTips?: string | null;
		recommendedWateringIntervalDays?: number;
		recommendedFertilizingIntervalDays?: number;
		lightRequirement?: PlantSpeciesRow['lightRequirement'];
		humidityPreference?: string;
		moderationStatus?: PlantSpeciesRow['moderationStatus'];
	}) {
		await db.update(plantSpecies)
			.set({
				...(input.name !== undefined && { name: input.name }),
				...(input.scientificName !== undefined && { scientificName: input.scientificName }),
				...(input.description !== undefined && { description: input.description }),
				...(input.careTips !== undefined && { careTips: input.careTips }),
				...(input.recommendedWateringIntervalDays !== undefined && { recommendedWateringIntervalDays: input.recommendedWateringIntervalDays }),
				...(input.recommendedFertilizingIntervalDays !== undefined && { recommendedFertilizingIntervalDays: input.recommendedFertilizingIntervalDays }),
				...(input.lightRequirement !== undefined && { lightRequirement: input.lightRequirement }),
				...(input.humidityPreference !== undefined && { humidityPreference: input.humidityPreference }),
				...(input.moderationStatus !== undefined && { moderationStatus: input.moderationStatus }),
				updatedAt: new Date()
			})
			.where(eq(plantSpecies.id, id));
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

	async deleteSpeciesImage(imageId: string) {
		await db.delete(plantSpeciesImages).where(eq(plantSpeciesImages.id, imageId));
	},

	async setPrimarySpeciesImage(speciesId: string, imageId: string) {
		// First, unset all primary for this species
		await db.update(plantSpeciesImages)
			.set({ isPrimary: false })
			.where(eq(plantSpeciesImages.plantSpeciesId, speciesId));

		// Then set the chosen one
		await db.update(plantSpeciesImages)
			.set({ isPrimary: true })
			.where(eq(plantSpeciesImages.id, imageId));
	},

	async getSpeciesImageWithOwner(imageId: string) {
		const [row] = await db
			.select({
				imageId: plantSpeciesImages.id,
				plantSpeciesId: plantSpeciesImages.plantSpeciesId,
				createdByUserId: plantSpecies.createdByUserId,
			})
			.from(plantSpeciesImages)
			.innerJoin(plantSpecies, eq(plantSpeciesImages.plantSpeciesId, plantSpecies.id))
			.where(eq(plantSpeciesImages.id, imageId))
			.limit(1);
		return row ?? null;
	},

	async countSpeciesImages(speciesId: string) {
		const [row] = await db
			.select({ count: sql<number>`count(*)`.as('count') })
			.from(plantSpeciesImages)
			.where(eq(plantSpeciesImages.plantSpeciesId, speciesId));
		return row?.count ?? 0;
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
	},

	async getProgressPhotoWithPlantOwner(photoId: string) {
		const [row] = await db
			.select({
				id: userPlantProgressPhotos.id,
				userPlantId: userPlantProgressPhotos.userPlantId,
				userId: userPlants.userId
			})
			.from(userPlantProgressPhotos)
			.innerJoin(userPlants, eq(userPlantProgressPhotos.userPlantId, userPlants.id))
			.where(eq(userPlantProgressPhotos.id, photoId))
			.limit(1);
		return row ?? null;
	},

	async deleteProgressPhoto(photoId: string) {
		await db.delete(userPlantProgressPhotos).where(eq(userPlantProgressPhotos.id, photoId));
	},

	async clearUserPlantCover(id: string) {
		await db
			.update(userPlants)
			.set({ coverImage: null, coverMimeType: null, updatedAt: new Date() })
			.where(eq(userPlants.id, id));
	},

	async updateUserPlant(id: string, updates: { nickname?: string; location?: string | null; notes?: string | null }) {
		const set: Record<string, any> = { updatedAt: new Date() };
		if (updates.nickname !== undefined) set.nickname = updates.nickname;
		if (updates.location !== undefined) set.location = updates.location;
		if (updates.notes !== undefined) set.notes = updates.notes;
		await db.update(userPlants).set(set).where(eq(userPlants.id, id));
	},

	async deleteUserPlant(id: string, userId: string) {
		// First delete related records
		await db.delete(userPlantProgressPhotos).where(
			eq(userPlantProgressPhotos.userPlantId, id)
		);
		await db.delete(wateringSchedules).where(
			eq(wateringSchedules.userPlantId, id)
		);
		// Then delete the plant
		await db.delete(userPlants).where(
			and(eq(userPlants.id, id), eq(userPlants.userId, userId))
		);
	}
};