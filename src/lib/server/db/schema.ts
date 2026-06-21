import {
	boolean,
	customType,
	index,
	int,
	mysqlEnum,
	mysqlTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	varchar
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

const longblob = customType<{ data: Buffer; driverData: Buffer }>({
	dataType() {
		return 'longblob';
	}
});

// ---------------------------------------------------------------------------
// Auth.js tables
// ---------------------------------------------------------------------------

export const users = mysqlTable('user', {
	id: varchar('id', { length: 255 })
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: varchar('name', { length: 255 }),
	email: varchar('email', { length: 255 }).notNull().unique(),
	emailVerified: timestamp('emailVerified', { mode: 'date', fsp: 3 }),
	image: varchar('image', { length: 255 }),
	passwordHash: varchar('passwordHash', { length: 255 }).notNull(),
	createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 }).defaultNow().notNull()
});

export const accounts = mysqlTable(
	'account',
	{
		userId: varchar('userId', { length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: varchar('type', { length: 255 }).notNull(),
		provider: varchar('provider', { length: 255 }).notNull(),
		providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
		refresh_token: varchar('refresh_token', { length: 255 }),
		access_token: varchar('access_token', { length: 255 }),
		expires_at: int('expires_at'),
		token_type: varchar('token_type', { length: 255 }),
		scope: varchar('scope', { length: 255 }),
		id_token: varchar('id_token', { length: 2048 }),
		session_state: varchar('session_state', { length: 255 })
	},
	(account) => ({
		compositePk: primaryKey({
			columns: [account.provider, account.providerAccountId]
		})
	})
);

export const sessions = mysqlTable('session', {
	sessionToken: varchar('sessionToken', { length: 255 }).primaryKey(),
	userId: varchar('userId', { length: 255 })
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expires: timestamp('expires', { mode: 'date' }).notNull()
});

export const verificationTokens = mysqlTable(
	'verificationToken',
	{
		identifier: varchar('identifier', { length: 255 }).notNull(),
		token: varchar('token', { length: 255 }).notNull(),
		expires: timestamp('expires', { mode: 'date' }).notNull()
	},
	(vt) => ({
		compositePk: primaryKey({ columns: [vt.identifier, vt.token] })
	})
);

// ---------------------------------------------------------------------------
// Plant catalog & user plants
// ---------------------------------------------------------------------------

export const lightRequirementEnum = mysqlEnum('light_requirement', [
	'low',
	'medium',
	'bright_indirect',
	'direct'
]);

export const moderationStatusEnum = mysqlEnum('moderation_status', [
	'pending',
	'approved',
	'rejected'
]);

export const healthStatusEnum = mysqlEnum('health_status', [
	'thriving',
	'healthy',
	'needs_attention',
	'struggling'
]);

export const notificationTypeEnum = mysqlEnum('notification_type', [
	'watering_due',
	'watering_reminder',
	'community_update',
	'system'
]);

export const plantSpecies = mysqlTable(
	'plant_species',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		name: varchar('name', { length: 255 }).notNull(),
		scientificName: varchar('scientific_name', { length: 255 }),
		description: text('description'),
		careTips: text('care_tips'),
		recommendedWateringIntervalDays: int('recommended_watering_interval_days').notNull(),
		recommendedFertilizingIntervalDays: int('recommended_fertilizing_interval_days').notNull(),
		lightRequirement: lightRequirementEnum.notNull().default('bright_indirect'),
		humidityPreference: varchar('humidity_preference', { length: 50 }).notNull().default('moderate'),
		isSystem: boolean('is_system').notNull().default(false),
		createdByUserId: varchar('created_by_user_id', { length: 255 }).references(() => users.id, {
			onDelete: 'set null'
		}),
		moderationStatus: moderationStatusEnum.notNull().default('approved'),
		moderationNotes: text('moderation_notes'),
		createdAt: timestamp('created_at', { mode: 'date', fsp: 3 }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { mode: 'date', fsp: 3 }).defaultNow().notNull()
	},
	(table) => ({
		nameIdx: index('plant_species_name_idx').on(table.name),
		createdByIdx: index('plant_species_created_by_idx').on(table.createdByUserId),
		moderationStatusIdx: index('plant_species_moderation_status_idx').on(table.moderationStatus)
	})
);

export const plantSpeciesImages = mysqlTable(
	'plant_species_images',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		plantSpeciesId: varchar('plant_species_id', { length: 36 })
			.notNull()
			.references(() => plantSpecies.id, { onDelete: 'cascade' }),
		imageData: longblob('image_data').notNull(),
		mimeType: varchar('mime_type', { length: 100 }).notNull().default('image/jpeg'),
		caption: varchar('caption', { length: 255 }),
		isPrimary: boolean('is_primary').notNull().default(false),
		sortOrder: int('sort_order').notNull().default(0),
		uploadedByUserId: varchar('uploaded_by_user_id', { length: 255 }).references(() => users.id, {
			onDelete: 'set null'
		}),
		createdAt: timestamp('created_at', { mode: 'date', fsp: 3 }).defaultNow().notNull()
	},
	(table) => ({
		speciesIdx: index('plant_species_images_species_idx').on(table.plantSpeciesId)
	})
);

export const userPlants = mysqlTable(
	'user_plants',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: varchar('user_id', { length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		plantSpeciesId: varchar('plant_species_id', { length: 36 })
			.notNull()
			.references(() => plantSpecies.id, { onDelete: 'restrict' }),
		nickname: varchar('nickname', { length: 255 }).notNull(),
		coverImage: longblob('cover_image'),
		coverMimeType: varchar('cover_mime_type', { length: 100 }),
		healthStatus: healthStatusEnum.notNull().default('healthy'),
		location: varchar('location', { length: 255 }),
		notes: text('notes'),
		acquiredAt: timestamp('acquired_at', { mode: 'date', fsp: 3 }),
		createdAt: timestamp('created_at', { mode: 'date', fsp: 3 }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { mode: 'date', fsp: 3 }).defaultNow().notNull()
	},
	(table) => ({
		userIdx: index('user_plants_user_idx').on(table.userId),
		speciesIdx: index('user_plants_species_idx').on(table.plantSpeciesId)
	})
);

export const userPlantProgressPhotos = mysqlTable(
	'user_plant_progress_photos',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userPlantId: varchar('user_plant_id', { length: 36 })
			.notNull()
			.references(() => userPlants.id, { onDelete: 'cascade' }),
		photoData: longblob('photo_data').notNull(),
		mimeType: varchar('mime_type', { length: 100 }).notNull().default('image/jpeg'),
		caption: text('caption'),
		takenAt: timestamp('taken_at', { mode: 'date', fsp: 3 }).notNull(),
		createdAt: timestamp('created_at', { mode: 'date', fsp: 3 }).defaultNow().notNull()
	},
	(table) => ({
		userPlantIdx: index('user_plant_progress_photos_plant_idx').on(table.userPlantId)
	})
);

// ---------------------------------------------------------------------------
// Watering
// ---------------------------------------------------------------------------

export const wateringSchedules = mysqlTable(
	'watering_schedules',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userPlantId: varchar('user_plant_id', { length: 36 })
			.notNull()
			.references(() => userPlants.id, { onDelete: 'cascade' }),
		useRecommendedSchedule: boolean('use_recommended_schedule').notNull().default(true),
		customIntervalDays: int('custom_interval_days'),
		preferredTime: varchar('preferred_time', { length: 5 }).notNull().default('09:00'),
		lastWateredAt: timestamp('last_watered_at', { mode: 'date', fsp: 3 }),
		nextWaterAt: timestamp('next_water_at', { mode: 'date', fsp: 3 }),
		reminderEnabled: boolean('reminder_enabled').notNull().default(true),
		createdAt: timestamp('created_at', { mode: 'date', fsp: 3 }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { mode: 'date', fsp: 3 }).defaultNow().notNull()
	},
	(table) => ({
		userPlantUnique: uniqueIndex('watering_schedules_user_plant_unique').on(table.userPlantId),
		nextWaterAtIdx: index('watering_schedules_next_water_at_idx').on(table.nextWaterAt)
	})
);

export const wateringLog = mysqlTable(
	'watering_log',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userPlantId: varchar('user_plant_id', { length: 36 })
			.notNull()
			.references(() => userPlants.id, { onDelete: 'cascade' }),
		wateredAt: timestamp('watered_at', { mode: 'date', fsp: 3 }).notNull(),
		notes: text('notes'),
		createdAt: timestamp('created_at', { mode: 'date', fsp: 3 }).defaultNow().notNull()
	},
	(table) => ({
		userPlantIdx: index('watering_log_user_plant_idx').on(table.userPlantId),
		wateredAtIdx: index('watering_log_watered_at_idx').on(table.wateredAt)
	})
);

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notifications = mysqlTable(
	'notifications',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: varchar('user_id', { length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: notificationTypeEnum.notNull(),
		title: varchar('title', { length: 255 }).notNull(),
		body: text('body').notNull(),
		relatedUserPlantId: varchar('related_user_plant_id', { length: 36 }).references(
			() => userPlants.id,
			{ onDelete: 'set null' }
		),
		relatedPlantSpeciesId: varchar('related_plant_species_id', { length: 36 }).references(
			() => plantSpecies.id,
			{ onDelete: 'set null' }
		),
		readAt: timestamp('read_at', { mode: 'date', fsp: 3 }),
		createdAt: timestamp('created_at', { mode: 'date', fsp: 3 }).defaultNow().notNull()
	},
	(table) => ({
		userIdx: index('notifications_user_idx').on(table.userId),
		typeIdx: index('notifications_type_idx').on(table.type),
		readAtIdx: index('notifications_read_at_idx').on(table.readAt)
	})
);

export const pushSubscriptions = mysqlTable(
	'push_subscriptions',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: varchar('user_id', { length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		endpoint: varchar('endpoint', { length: 512 }).notNull(),
		p256dh: varchar('p256dh', { length: 255 }).notNull(),
		auth: varchar('auth', { length: 255 }).notNull(),
		createdAt: timestamp('created_at', { mode: 'date', fsp: 3 }).defaultNow().notNull()
	},
	(table) => ({
		userIdx: index('push_subscriptions_user_idx').on(table.userId),
		endpointUnique: uniqueIndex('push_subscriptions_endpoint_unique').on(table.endpoint)
	})
);

export const notificationPreferences = mysqlTable('notification_preferences', {
	userId: varchar('user_id', { length: 255 })
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	wateringDueEnabled: boolean('watering_due_enabled').notNull().default(true),
	wateringReminderEnabled: boolean('watering_reminder_enabled').notNull().default(true),
	communityUpdateEnabled: boolean('community_update_enabled').notNull().default(true),
	systemEnabled: boolean('system_enabled').notNull().default(true),
	pushEnabled: boolean('push_enabled').notNull().default(true),
	updatedAt: timestamp('updated_at', { mode: 'date', fsp: 3 }).defaultNow().notNull()
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many, one }) => ({
	accounts: many(accounts),
	sessions: many(sessions),
	userPlants: many(userPlants),
	plantSpeciesSubmissions: many(plantSpecies),
	plantSpeciesImages: many(plantSpeciesImages),
	notifications: many(notifications),
	pushSubscriptions: many(pushSubscriptions),
	notificationPreferences: one(notificationPreferences, {
		fields: [users.id],
		references: [notificationPreferences.userId]
	})
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	})
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	})
}));

export const plantSpeciesRelations = relations(plantSpecies, ({ one, many }) => ({
	createdBy: one(users, {
		fields: [plantSpecies.createdByUserId],
		references: [users.id]
	}),
	images: many(plantSpeciesImages),
	userPlants: many(userPlants),
	notifications: many(notifications)
}));

export const plantSpeciesImagesRelations = relations(plantSpeciesImages, ({ one }) => ({
	plantSpecies: one(plantSpecies, {
		fields: [plantSpeciesImages.plantSpeciesId],
		references: [plantSpecies.id]
	}),
	uploadedBy: one(users, {
		fields: [plantSpeciesImages.uploadedByUserId],
		references: [users.id]
	})
}));

export const userPlantsRelations = relations(userPlants, ({ one, many }) => ({
	user: one(users, {
		fields: [userPlants.userId],
		references: [users.id]
	}),
	plantSpecies: one(plantSpecies, {
		fields: [userPlants.plantSpeciesId],
		references: [plantSpecies.id]
	}),
	progressPhotos: many(userPlantProgressPhotos),
	wateringSchedule: one(wateringSchedules, {
		fields: [userPlants.id],
		references: [wateringSchedules.userPlantId]
	}),
	wateringLogs: many(wateringLog),
	notifications: many(notifications)
}));

export const userPlantProgressPhotosRelations = relations(userPlantProgressPhotos, ({ one }) => ({
	userPlant: one(userPlants, {
		fields: [userPlantProgressPhotos.userPlantId],
		references: [userPlants.id]
	})
}));

export const wateringSchedulesRelations = relations(wateringSchedules, ({ one }) => ({
	userPlant: one(userPlants, {
		fields: [wateringSchedules.userPlantId],
		references: [userPlants.id]
	})
}));

export const wateringLogRelations = relations(wateringLog, ({ one }) => ({
	userPlant: one(userPlants, {
		fields: [wateringLog.userPlantId],
		references: [userPlants.id]
	})
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
	relatedUserPlant: one(userPlants, {
		fields: [notifications.relatedUserPlantId],
		references: [userPlants.id]
	}),
	relatedPlantSpecies: one(plantSpecies, {
		fields: [notifications.relatedPlantSpeciesId],
		references: [plantSpecies.id]
	})
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
	user: one(users, {
		fields: [pushSubscriptions.userId],
		references: [users.id]
	})
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
	user: one(users, {
		fields: [notificationPreferences.userId],
		references: [users.id]
	})
}));