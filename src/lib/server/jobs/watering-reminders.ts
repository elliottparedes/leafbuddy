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
	
	// Group plants by user for batch notifications
	const plantsByUser = new Map<string, typeof duePlants>();
	for (const entry of duePlants) {
		const list = plantsByUser.get(entry.plant.userId) || [];
		list.push(entry);
		plantsByUser.set(entry.plant.userId, list);
	}
	
	const result: WateringReminderJobResult = {
		processed: duePlants.length,
		notificationsCreated: 0,
		pushSent: 0,
		errors: []
	};

	for (const [userId, plants] of plantsByUser) {
		const prefs = await notificationRepository.ensurePreferences(userId);

		if (!prefs.wateringDueEnabled && !prefs.wateringReminderEnabled) {
			continue;
		}

		// Filter plants that don't already have notifications
		const plantsNeedingNotification = [];
		for (const entry of plants) {
			if (!(await notificationRepository.hasUnreadWateringNotification(userId, entry.plant.id))) {
				plantsNeedingNotification.push(entry);
			}
		}

		if (plantsNeedingNotification.length === 0) {
			continue;
		}

		try {
			if (plantsNeedingNotification.length === 1) {
				// Single plant notification with action button
				const { plant, species } = plantsNeedingNotification[0];
				const title = `Time to water ${plant.nickname}`;
				const body = `${species.name} is due for watering.`;

				await notificationService.create({
					userId,
					type: 'watering_due',
					title,
					body,
					relatedUserPlantId: plant.id
				});
				result.notificationsCreated += 1;

				if (prefs.pushEnabled) {
					const subscriptions = await notificationRepository.listPushSubscriptionsForUser(userId);
					for (const sub of subscriptions) {
						try {
							await sendPushNotification(
								{ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
								{
									title,
									body,
									url: `/my-plants/${plant.id}`,
									plantId: plant.id,
									tag: `watering-${plant.id}`,
									requireInteraction: true,
									actions: [
										{ action: 'mark-watered', title: '✓ Mark Watered' },
										{ action: 'view', title: 'View Plant' }
									]
								}
							);
							result.pushSent += 1;
						} catch (error) {
							const message = error instanceof Error ? error.message : 'Push send failed';
							result.errors.push(`Push to ${userId}: ${message}`);
						}
					}
				}
			} else {
				// Multiple plants - group notification
				const plantNames = plantsNeedingNotification.map(p => p.plant.nickname).join(', ');
				const title = `${plantsNeedingNotification.length} plants need water`;
				const body = plantsNeedingNotification.length <= 3 
					? `${plantNames} are due for watering.`
					: `${plantsNeedingNotification[0].plant.nickname} and ${plantsNeedingNotification.length - 1} others need water.`;

				// Create individual notifications for each plant
				for (const { plant, species } of plantsNeedingNotification) {
					await notificationService.create({
						userId,
						type: 'watering_due',
						title: `Time to water ${plant.nickname}`,
						body: `${species.name} is due for watering.`,
						relatedUserPlantId: plant.id
					});
					result.notificationsCreated += 1;
				}

				if (prefs.pushEnabled) {
					const subscriptions = await notificationRepository.listPushSubscriptionsForUser(userId);
					for (const sub of subscriptions) {
						try {
							await sendPushNotification(
								{ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
								{
									title,
									body,
									url: '/',
									tag: 'watering-summary',
									requireInteraction: true,
									renotify: true,
									actions: [
										{ action: 'view-all', title: 'View All' }
									]
								}
							);
							result.pushSent += 1;
						} catch (error) {
							const message = error instanceof Error ? error.message : 'Push send failed';
							result.errors.push(`Push to ${userId}: ${message}`);
						}
					}
				}
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Reminder failed';
			result.errors.push(`User ${userId}: ${message}`);
		}
	}

	return result;
}