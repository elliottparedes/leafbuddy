import { suggestNickname } from '$lib/plant-names';
import { plantRepository } from '$lib/server/repositories/plant-repository';
import type { ServiceResult } from '$lib/server/services/result';
import { wateringService } from '$lib/server/services/watering-service';
import { formTrimmed } from '$lib/server/validation/form';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']);

function getMimeTypeFromFileName(fileName: string): string {
	const ext = fileName.toLowerCase().split('.').pop();
	switch (ext) {
		case 'jpg':
		case 'jpeg':
			return 'image/jpeg';
		case 'png':
			return 'image/png';
		case 'webp':
			return 'image/webp';
		case 'gif':
			return 'image/gif';
		case 'heic':
			return 'image/heic';
		case 'heif':
			return 'image/heif';
		default:
			return 'image/jpeg';
	}
}

export async function parseImageFromFormData(
	formData: FormData,
	key: string
): Promise<ServiceResult<{ buffer: Buffer; mimeType: string } | null>> {
	const file = formData.get(key);
	if (!file || !(file instanceof File) || file.size === 0) {
		return { ok: true, data: null };
	}

	if (file.size > MAX_IMAGE_SIZE) {
		return { ok: false, message: 'Image must be 5MB or smaller.' };
	}

	// Use file.type if available, otherwise infer from filename
	let mimeType = file.type;
	if (!mimeType || mimeType === 'application/octet-stream') {
		mimeType = getMimeTypeFromFileName(file.name);
	}

	if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
		return { ok: false, message: 'Image must be JPEG, PNG, WebP, GIF, or HEIC.' };
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	return { ok: true, data: { buffer, mimeType } };
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
}

export const plantService = {
	async addUserPlantFromForm(userId: string, formData: FormData): Promise<ServiceResult<{ id: string }>> {
		const plantSpeciesId = formTrimmed(formData, 'plantSpeciesId');
		let nickname = formTrimmed(formData, 'nickname');
		const location = formTrimmed(formData, 'location');
		const notes = formTrimmed(formData, 'notes');
		const useRecommended = formData.get('useRecommendedSchedule') === 'on' ||
			formData.get('useRecommendedSchedule') === 'true';
		const customIntervalDays = formTrimmed(formData, 'customIntervalDays');

		if (!plantSpeciesId) {
			return { ok: false, message: 'Please select a plant species.' };
		}

		const species = await plantRepository.findSpeciesById(plantSpeciesId);
		if (!species || species.moderationStatus !== 'approved') {
			return { ok: false, message: 'Selected species is not available.' };
		}

		if (!nickname) {
			nickname = suggestNickname(species.name);
		}

		const imageResult = await parseImageFromFormData(formData, 'coverImage');
		if (!imageResult.ok) return imageResult;

		const plantId = await plantRepository.createUserPlant({
			userId,
			plantSpeciesId,
			nickname,
			coverImage: imageResult.data?.buffer ?? null,
			coverMimeType: imageResult.data?.mimeType ?? null,
			location: location ?? null,
			notes: notes ?? null
		});

		await wateringService.createScheduleForPlant({
			userPlantId: plantId,
			useRecommendedSchedule: useRecommended,
			customIntervalDays: useRecommended
				? null
				: parsePositiveInt(customIntervalDays, species.recommendedWateringIntervalDays),
			recommendedIntervalDays: species.recommendedWateringIntervalDays
		});

		return { ok: true, data: { id: plantId } };
	},

	async contributeSpeciesFromForm(
		userId: string,
		formData: FormData
	): Promise<ServiceResult<{ id: string }>> {
		const name = formTrimmed(formData, 'name');
		const scientificName = formTrimmed(formData, 'scientificName');
		const description = formTrimmed(formData, 'description');
		const careTips = formTrimmed(formData, 'careTips');
		const lightRequirement = formTrimmed(formData, 'lightRequirement') as
			| 'low'
			| 'medium'
			| 'bright_indirect'
			| 'direct'
			| undefined;
		const humidityPreference = formTrimmed(formData, 'humidityPreference') ?? 'moderate';
		const wateringDays = formTrimmed(formData, 'recommendedWateringIntervalDays');
		const fertilizingDays = formTrimmed(formData, 'recommendedFertilizingIntervalDays');

		if (!name) {
			return { ok: false, message: 'Species name is required.' };
		}

		const imageResult = await parseImageFromFormData(formData, 'image');
		if (!imageResult.ok) return imageResult;
		if (!imageResult.data) {
			return { ok: false, message: 'A reference image is required.' };
		}

		const speciesId = await plantRepository.createSpecies({
			name,
			scientificName: scientificName ?? null,
			description: description ?? null,
			careTips: careTips ?? null,
			recommendedWateringIntervalDays: parsePositiveInt(wateringDays, 7),
			recommendedFertilizingIntervalDays: parsePositiveInt(fertilizingDays, 30),
			lightRequirement: lightRequirement ?? 'bright_indirect',
			humidityPreference,
			createdByUserId: userId,
			moderationStatus: 'pending'
		});

		await plantRepository.createSpeciesImage({
			plantSpeciesId: speciesId,
			imageData: imageResult.data.buffer,
			mimeType: imageResult.data.mimeType,
			uploadedByUserId: userId,
			isPrimary: true
		});

		return { ok: true, data: { id: speciesId } };
	},

	async updateSpeciesFromForm(
		userId: string,
		speciesId: string,
		formData: FormData
	): Promise<ServiceResult<{ id: string }>> {
		const species = await plantRepository.findSpeciesById(speciesId);
		if (!species) {
			return { ok: false, message: 'Species not found.' };
		}

		// For now, allow any logged-in user to edit catalog entries
		// if (species.createdByUserId !== userId) {
		// 	return { ok: false, message: 'You can only edit species you contributed.' };
		// }

		const name = formTrimmed(formData, 'name');
		const scientificName = formTrimmed(formData, 'scientificName');
		const description = formTrimmed(formData, 'description');
		const careTips = formTrimmed(formData, 'careTips');
		const lightRequirement = formTrimmed(formData, 'lightRequirement') as
			| 'low'
			| 'medium'
			| 'bright_indirect'
			| 'direct'
			| undefined;
		const humidityPreference = formTrimmed(formData, 'humidityPreference') ?? species.humidityPreference;
		const wateringDays = formTrimmed(formData, 'recommendedWateringIntervalDays');
		const fertilizingDays = formTrimmed(formData, 'recommendedFertilizingIntervalDays');

		if (!name) {
			return { ok: false, message: 'Species name is required.' };
		}

		const imageResult = await parseImageFromFormData(formData, 'image');
		if (!imageResult.ok) return imageResult;

		await plantRepository.updateSpecies(speciesId, {
			name,
			scientificName: scientificName ?? null,
			description: description ?? null,
			careTips: careTips ?? null,
			recommendedWateringIntervalDays: parsePositiveInt(wateringDays, species.recommendedWateringIntervalDays),
			recommendedFertilizingIntervalDays: parsePositiveInt(fertilizingDays, species.recommendedFertilizingIntervalDays),
			lightRequirement: lightRequirement ?? species.lightRequirement,
			humidityPreference
		});

		// If new image provided, add it and make it primary
		if (imageResult.data) {
			const newId = await plantRepository.createSpeciesImage({
				plantSpeciesId: speciesId,
				imageData: imageResult.data.buffer,
				mimeType: imageResult.data.mimeType,
				uploadedByUserId: userId,
				isPrimary: false
			});
			await plantRepository.setPrimarySpeciesImage(speciesId, newId);
		}

		return { ok: true, data: { id: speciesId } };
	},

	async deleteSpeciesImage(userId: string, imageId: string): Promise<ServiceResult<void>> {
		const imageInfo = await plantRepository.getSpeciesImageWithOwner(imageId);
		if (!imageInfo) {
			return { ok: false, message: 'Image not found or not authorized.' };
		}

		const count = await plantRepository.countSpeciesImages(imageInfo.plantSpeciesId);
		if (count <= 1) {
			return { ok: false, message: 'Cannot delete the last image for a species.' };
		}

		await plantRepository.deleteSpeciesImage(imageId);
		return { ok: true, data: undefined };
	},

	async setSpeciesImagePrimary(userId: string, speciesId: string, imageId: string): Promise<ServiceResult<void>> {
		const species = await plantRepository.findSpeciesById(speciesId);
		if (!species) {
			return { ok: false, message: 'Not authorized.' };
		}

		await plantRepository.setPrimarySpeciesImage(speciesId, imageId);
		return { ok: true, data: undefined };
	},

	async uploadProgressPhotoFromForm(
		userId: string,
		userPlantId: string,
		formData: FormData
	): Promise<ServiceResult<{ id: string }>> {
		const plant = await plantRepository.findUserPlantById(userPlantId, userId);
		if (!plant) {
			return { ok: false, message: 'Plant not found.' };
		}

		const imageResult = await parseImageFromFormData(formData, 'photo');
		if (!imageResult.ok) return imageResult;
		if (!imageResult.data) {
			return { ok: false, message: 'Please choose a photo to upload.' };
		}

		const caption = formTrimmed(formData, 'caption');
		const photoId = await plantRepository.createProgressPhoto({
			userPlantId,
			photoData: imageResult.data.buffer,
			mimeType: imageResult.data.mimeType,
			caption: caption ?? null
		});

		return { ok: true, data: { id: photoId } };
	},

	async deleteProgressPhoto(userId: string, photoId: string): Promise<ServiceResult<void>> {
		const photoInfo = await plantRepository.getProgressPhotoWithPlantOwner(photoId);
		if (!photoInfo || photoInfo.userId !== userId) {
			return { ok: false, message: 'Photo not found or not authorized.' };
		}
		await plantRepository.deleteProgressPhoto(photoId);
		return { ok: true, data: undefined };
	},

	async removeUserPlantCover(userId: string, userPlantId: string): Promise<ServiceResult<void>> {
		const plant = await plantRepository.findUserPlantById(userPlantId, userId);
		if (!plant) {
			return { ok: false, message: 'Plant not found.' };
		}
		await plantRepository.clearUserPlantCover(userPlantId);
		return { ok: true, data: undefined };
	},

	async updateUserPlant(
		userId: string,
		userPlantId: string,
		updates: { nickname?: string; location?: string | null; notes?: string | null }
	): Promise<ServiceResult<void>> {
		const plant = await plantRepository.findUserPlantById(userPlantId, userId);
		if (!plant) {
			return { ok: false, message: 'Plant not found.' };
		}
		await plantRepository.updateUserPlant(userPlantId, updates);
		return { ok: true, data: undefined };
	},

	async deleteUserPlant(userId: string, userPlantId: string): Promise<ServiceResult<void>> {
		const plant = await plantRepository.findUserPlantById(userPlantId, userId);
		if (!plant) {
			return { ok: false, message: 'Plant not found.' };
		}
		await plantRepository.deleteUserPlant(userPlantId, userId);
		return { ok: true, data: undefined };
	}
};