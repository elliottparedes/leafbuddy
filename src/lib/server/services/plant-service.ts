import { suggestNickname } from '$lib/plant-names';
import { plantRepository } from '$lib/server/repositories/plant-repository';
import type { ServiceResult } from '$lib/server/services/result';
import { wateringService } from '$lib/server/services/watering-service';
import { formTrimmed } from '$lib/server/validation/form';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

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

	const mimeType = file.type || 'image/jpeg';
	if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
		return { ok: false, message: 'Image must be JPEG, PNG, WebP, or GIF.' };
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
	}
};