import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  phone: varchar('phone', { length: 20 }),
  isMember: boolean('is_member').notNull().default(false),
  walletBalance: integer('wallet_balance').notNull().default(0),
  totalXp: integer('total_xp').notNull().default(0),
});

export const stations = pgTable('stations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('Active'),
  ratePerHour: integer('rate_per_hour').notNull(),
  coinsPerHour: integer('coins_per_hour').notNull().default(4),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  stationId: integer('station_id').notNull().references(() => stations.id),
  userId: integer('user_id').references(() => users.id),
  startTime: timestamp('start_time').notNull().defaultNow(),
  endTime: timestamp('end_time'),
  durationMinutes: integer('duration_minutes').notNull().default(0),
  setupMinutes: integer('setup_minutes').notNull().default(0),
  totalPrice: integer('total_price').notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('Active'),
  userPhone: varchar('user_phone', { length: 20 }),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => sessions.id),
  userPhone: varchar('user_phone', { length: 20 }),
  amountCash: integer('amount_cash').notNull().default(0),
  amountCreditsUsed: integer('amount_credits_used').notNull().default(0),
  transactionType: varchar('transaction_type', { length: 50 }).notNull(), // 'Session', 'Membership', 'Snack', 'Income', 'Expense'
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  customerName: varchar('customer_name', { length: 100 }),
  comment: text('comment'),
});

export const membershipPlans = pgTable('membership_plans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  price: integer('price').notNull(),
  creditsValue: integer('credits_value').notNull(),
  hoursIncluded: integer('hours_included').notNull(),
});

export const userMemberships = pgTable('user_memberships', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  phone: varchar('phone', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  planId: integer('plan_id').references(() => membershipPlans.id),
  coinsBalance: integer('coins_balance').notNull().default(0),
  validUntil: timestamp('valid_until'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type Station = typeof stations.$inferSelect;
export type NewStation = typeof stations.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type NewMembershipPlan = typeof membershipPlans.$inferInsert;
export type UserMembership = typeof userMemberships.$inferSelect;
export type NewUserMembership = typeof userMemberships.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}

export const leaderboard = pgTable('leaderboard', {
  id: serial('id').primaryKey(),
  rank: integer('rank').notNull(),
  playerName: varchar('player_name', { length: 100 }).notNull(),
  gamerTag: varchar('gamer_tag', { length: 100 }).notNull(),
  gameName: varchar('game_name', { length: 100 }).notNull(),
  score: integer('score').notNull(),
  pointsType: varchar('points_type', { length: 50 }).notNull().default('XP'),
  formattedScore: varchar('formatted_score', { length: 50 }).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  rankTier: varchar('rank_tier', { length: 50 }).notNull().default('Gold'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type LeaderboardEntry = typeof leaderboard.$inferSelect;
export type NewLeaderboardEntry = typeof leaderboard.$inferInsert;

export const addons = pgTable('addons', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  price: integer('price').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const sessionAddons = pgTable('session_addons', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => sessions.id),
  transactionId: integer('transaction_id').references(() => transactions.id),
  addonId: integer('addon_id').notNull().references(() => addons.id),
  quantity: integer('quantity').notNull().default(1),
  priceAtPurchase: integer('price_at_purchase').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Addon = typeof addons.$inferSelect;
export type NewAddon = typeof addons.$inferInsert;
export type SessionAddon = typeof sessionAddons.$inferSelect;
export type NewSessionAddon = typeof sessionAddons.$inferInsert;


