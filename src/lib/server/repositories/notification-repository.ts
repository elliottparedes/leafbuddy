import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	notificationPreferences,
	notifications,
	pushSubscriptions
} from '$lib/server/db/schema';

export type NotificationRow = typeof notifications.$inferSelect;
export type NotificationPreferencesRow = typeof notificationPreferences.$inferSelect;

export const notificationRepository = {
	async listForUser(userId: string, limit = 50) {
		return db
			.select()
			.from(notifications)
			.where(eq(notifications.userId, userId))
			.orderBy(desc(notifications.createdAt))
			.limit(limit);
	},

	async countUnread(userId: string) {
		const [row] = await db
			.select({ count: sql<number>`count(*)` })
			.from(notifications)
			.where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
		return Number(row?.count ?? 0);
	},

	async create(input: {
		userId: string;
		type: NotificationRow['type'];
		title: string;
		body: string;
		relatedUserPlantId?: string | null;
		relatedPlantSpeciesId?: string | null;
	}) {
		const id = crypto.randomUUID();
		await db.insert(notifications).values({
			id,
			userId: input.userId,
			type: input.type,
			title: input.title,
			body: input.body,
			relatedUserPlantId: input.relatedUserPlantId ?? null,
			relatedPlantSpeciesId: input.relatedPlantSpeciesId ?? null
		});
		return id;
	},

	async markRead(id: string, userId: string) {
		await db
			.update(notifications)
			.set({ readAt: new Date() })
			.where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
	},

	async markAllRead(userId: string) {
		await db
			.update(notifications)
			.set({ readAt: new Date() })
			.where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
	},

	async getPreferences(userId: string) {
		const [row] = await db
			.select()
			.from(notificationPreferences)
			.where(eq(notificationPreferences.userId, userId))
			.limit(1);
		return row ?? null;
	},

	async ensurePreferences(userId: string) {
		const existing = await this.getPreferences(userId);
		if (existing) return existing;

		await db.insert(notificationPreferences).values({ userId });
		return (await this.getPreferences(userId))!;
	},

	async updatePreferences(
		userId: string,
		input: Partial<
			Pick<
				NotificationPreferencesRow,
				| 'wateringDueEnabled'
				| 'wateringReminderEnabled'
				| 'communityUpdateEnabled'
				| 'systemEnabled'
				| 'pushEnabled'
			>
		>
	) {
		await this.ensurePreferences(userId);
		await db
			.update(notificationPreferences)
			.set({ ...input, updatedAt: new Date() })
			.where(eq(notificationPreferences.userId, userId));
	},

	async upsertPushSubscription(input: {
		userId: string;
		endpoint: string;
		p256dh: string;
		auth: string;
	}) {
		await db
			.insert(pushSubscriptions)
			.values({
				id: crypto.randomUUID(),
				userId: input.userId,
				endpoint: input.endpoint,
				p256dh: input.p256dh,
				auth: input.auth
			})
			.onDuplicateKeyUpdate({
				set: {
					userId: input.userId,
					p256dh: input.p256dh,
					auth: input.auth
				}
			});
	},

	async deletePushSubscription(userId: string, endpoint: string) {
		await db
			.delete(pushSubscriptions)
			.where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
	},

	async listPushSubscriptionsForUser(userId: string) {
		return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
	},

	async hasUnreadWateringNotification(userId: string, userPlantId: string) {
		const [row] = await db
			.select({ id: notifications.id })
			.from(notifications)
			.where(
				and(
					eq(notifications.userId, userId),
					eq(notifications.relatedUserPlantId, userPlantId),
					eq(notifications.type, 'watering_due'),
					isNull(notifications.readAt)
				)
			)
			.limit(1);
		return Boolean(row);
	}
};