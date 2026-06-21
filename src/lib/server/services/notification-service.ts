import { notificationRepository } from '$lib/server/repositories/notification-repository';
import type { ServiceResult } from '$lib/server/services/result';

export const notificationService = {
	async getUnreadCount(userId: string) {
		return notificationRepository.countUnread(userId);
	},

	async listForUser(userId: string) {
		return notificationRepository.listForUser(userId);
	},

	async create(input: {
		userId: string;
		type: 'watering_due' | 'watering_reminder' | 'community_update' | 'system';
		title: string;
		body: string;
		relatedUserPlantId?: string | null;
		relatedPlantSpeciesId?: string | null;
	}) {
		return notificationRepository.create(input);
	},

	async markRead(notificationId: string, userId: string): Promise<ServiceResult<void>> {
		await notificationRepository.markRead(notificationId, userId);
		return { ok: true, data: undefined };
	},

	async markAllRead(userId: string) {
		await notificationRepository.markAllRead(userId);
	},

	async getPreferences(userId: string) {
		return notificationRepository.ensurePreferences(userId);
	},

	async updatePreferencesFromForm(userId: string, formData: FormData): Promise<ServiceResult<void>> {
		const bool = (key: string) => formData.get(key) === 'on' || formData.get(key) === 'true';

		await notificationRepository.updatePreferences(userId, {
			wateringDueEnabled: bool('wateringDueEnabled'),
			wateringReminderEnabled: bool('wateringReminderEnabled'),
			communityUpdateEnabled: bool('communityUpdateEnabled'),
			systemEnabled: bool('systemEnabled'),
			pushEnabled: bool('pushEnabled')
		});

		return { ok: true, data: undefined };
	},

	async savePushSubscription(
		userId: string,
		subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
	) {
		await notificationRepository.upsertPushSubscription({
			userId,
			endpoint: subscription.endpoint,
			p256dh: subscription.keys.p256dh,
			auth: subscription.keys.auth
		});
	},

	async removePushSubscription(userId: string, endpoint: string) {
		await notificationRepository.deletePushSubscription(userId, endpoint);
	}
};