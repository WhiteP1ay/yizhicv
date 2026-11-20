import { relations, sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const identityProviders = ["github", "phone"] as const;

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().default(""),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const identities = pgTable(
  "identities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: identityProviders }).notNull(),
    providerUserId: text("provider_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique().on(table.provider, table.providerUserId),
    index().on(table.userId),
    check(
      "identities_provider_check",
      sql`${table.provider} in ('github', 'phone')`,
    ),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index().on(table.userId)],
);

export const captchas = pgTable("captchas", {
  id: uuid("id").primaryKey().defaultRandom(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const phoneCodeCooldowns = pgTable("phone_code_cooldowns", {
  phone: text("phone").primaryKey(),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull(),
});

export const userImageStatuses = ["pending", "ready"] as const;

export const userImages = pgTable(
  "user_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    objectKey: text("object_key").notNull().unique(),
    byteSize: integer("byte_size").notNull(),
    contentType: text("content_type").notNull(),
    name: text("name").notNull().default(""),
    status: text("status", { enum: userImageStatuses }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index().on(table.userId),
    check(
      "user_images_status_check",
      sql`${table.status} in ('pending', 'ready')`,
    ),
  ],
);

export const aiLedgerKinds = ["grant", "debit", "topup"] as const;

export const aiByokProviders = [
  "openai",
  "anthropic",
  "google",
  "deepseek",
  "groq",
  "bailian",
  "siliconflow",
  "openrouter",
] as const;

/**
 * 每个账号一份 BYOK 配置。key_ciphertext 是 AES-256-GCM 密文，
 * 明文 key 不落库、接口也不回传。
 */
export const aiByok = pgTable(
  "ai_byok",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: aiByokProviders }).notNull(),
    model: text("model"),
    keyCiphertext: text("key_ciphertext").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "ai_byok_provider_check",
      sql`${table.provider} in ('openai', 'anthropic', 'google', 'deepseek', 'groq', 'bailian', 'siliconflow', 'openrouter')`,
    ),
  ],
);

/**
 * 账户可用余额，单位是 pico-CNY（1 元 = 1e12）。
 * 这是扣掉未结算预扣之后还能再花的数。欢迎额度不是布尔开关，
 * 而是账本里每个账号唯一的一条 grant。
 */
export const aiAccounts = pgTable(
  "ai_accounts",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    balancePicoCny: bigint("balance_pico_cny", { mode: "bigint" })
      .notNull()
      .default(sql`0`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("ai_accounts_balance_nonnegative", sql`${table.balancePicoCny} >= 0`),
  ],
);

/**
 * 余额流水。kind = grant 是一次性开通额度，debit 是直接使用扣费，
 * topup 留给以后的付费充值。同一账号的 idempotency_key 唯一。
 */
export const aiLedger = pgTable(
  "ai_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: aiLedgerKinds }).notNull(),
    amountPicoCny: bigint("amount_pico_cny", { mode: "bigint" }).notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique().on(table.userId, table.idempotencyKey),
    index().on(table.userId),
    check(
      "ai_ledger_kind_check",
      sql`${table.kind} in ('grant', 'debit', 'topup')`,
    ),
  ],
);

/** 进行中的直接使用预扣。崩溃超过两分钟后由下一笔请求退回可用余额。 */
export const aiHolds = pgTable(
  "ai_holds",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amountPicoCny: bigint("amount_pico_cny", { mode: "bigint" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index().on(table.userId),
    check("ai_holds_amount_positive", sql`${table.amountPicoCny} > 0`),
  ],
);

export const usersRelations = relations(users, ({ many, one }) => ({
  identities: many(identities),
  sessions: many(sessions),
  aiAccount: one(aiAccounts, {
    fields: [users.id],
    references: [aiAccounts.userId],
  }),
  aiByok: one(aiByok, {
    fields: [users.id],
    references: [aiByok.userId],
  }),
  aiLedger: many(aiLedger),
  aiHolds: many(aiHolds),
}));

export const identitiesRelations = relations(identities, ({ one }) => ({
  user: one(users, {
    fields: [identities.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const aiAccountsRelations = relations(aiAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [aiAccounts.userId],
    references: [users.id],
  }),
  ledger: many(aiLedger),
  holds: many(aiHolds),
}));

export const aiLedgerRelations = relations(aiLedger, ({ one }) => ({
  user: one(users, {
    fields: [aiLedger.userId],
    references: [users.id],
  }),
  account: one(aiAccounts, {
    fields: [aiLedger.userId],
    references: [aiAccounts.userId],
  }),
}));

export const aiByokRelations = relations(aiByok, ({ one }) => ({
  user: one(users, {
    fields: [aiByok.userId],
    references: [users.id],
  }),
}));

/** 登录用户的 AI 对话。未登录的对话只留在浏览器本地。 */
export const aiThreads = pgTable(
  "ai_threads",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    messages: jsonb("messages").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index().on(table.userId, table.updatedAt)],
);

export const aiThreadsRelations = relations(aiThreads, ({ one }) => ({
  user: one(users, {
    fields: [aiThreads.userId],
    references: [users.id],
  }),
}));

/** 登录用户的简历。未登录的简历只留在这台浏览器。 */
export const resumes = pgTable(
  "resumes",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    document: jsonb("document").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index().on(table.userId, table.updatedAt)],
);

export const resumesRelations = relations(resumes, ({ one }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id],
  }),
}));

export const aiHoldsRelations = relations(aiHolds, ({ one }) => ({
  user: one(users, {
    fields: [aiHolds.userId],
    references: [users.id],
  }),
  account: one(aiAccounts, {
    fields: [aiHolds.userId],
    references: [aiAccounts.userId],
  }),
}));

export type User = typeof users.$inferSelect;
export type Identity = typeof identities.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type UserImage = typeof userImages.$inferSelect;
