import { notificationRepository } from '$lib/server/repositories/notification-repository';
import { sendPushNotification } from '$lib/server/push';
import { notificationService } from '$lib/server/services/notification-service';
import { wateringService } from '$lib/server/services/watering-service';

export type WateringReminderJobResult = {
	processed: number;
	notificationsCreated: number;
	pushSent: number;
	errors: string[];
};

export async function runWateringRemindersJob(now = new Date()): Promise<WateringReminderJobResult> {
	const duePlants = await wateringService.findDuePlants(now);
	const result: WateringReminderJobResult = {
		processed: duePlants.length,
		notificationsCreated: 0,
		pushSent: 0,
		errors: []
	};

	for (const entry of duePlants) {
		const { plant, species } = entry;
		const prefs = await notificationRepository.ensurePreferences(plant.userId);

		if (!prefs.wateringDueEnabled && !prefs.wateringReminderEnabled) {
			continue;
		}

		if (await notificationRepository.hasUnreadWateringNotification(plant.userId, plant.id)) {
			continue;
		}

		const title = `Time to water ${plant.nickname}`;
		const body = `${species.name} is due for watering.`;

		try {
			await notificationService.create({
				userId: plant.userId,
				type: 'watering_due',
				title,
				body,
				relatedUserPlantId: plant.id
			});
			result.notificationsCreated += 1;

			if (prefs.pushEnabled) {
				const subscriptions = await notificationRepository.listPushSubscriptionsForUser(plant.userId);
				for (const sub of subscriptions) {
					try {
						await sendPushNotification(
							{ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
							{
								title,
								body,
								url: `/my-plants/${plant.id}`
							}
						);
						result.pushSent += 1;
					} catch (error) {
						const message = error instanceof Error ? error.message : 'Push send failed';
						result.errors.push(`Push to ${plant.userId}: ${message}`);
					}
				}
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Reminder failed';
			result.errors.push(`Plant ${plant.id}: ${message}`);
		}
	}

	return result;
}