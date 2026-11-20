CREATE TABLE "ai_accounts" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"balance_pico_cny" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_accounts_balance_nonnegative" CHECK ("ai_accounts"."balance_pico_cny" >= 0)
);
--> statement-breakpoint
CREATE TABLE "ai_holds" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"amount_pico_cny" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_holds_amount_positive" CHECK ("ai_holds"."amount_pico_cny" > 0)
);
--> statement-breakpoint
CREATE TABLE "ai_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"amount_pico_cny" bigint NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_ledger_user_id_idempotency_key_unique" UNIQUE("user_id","idempotency_key"),
	CONSTRAINT "ai_ledger_kind_check" CHECK ("ai_ledger"."kind" in ('grant', 'debit', 'topup'))
);
--> statement-breakpoint
ALTER TABLE "ai_accounts" ADD CONSTRAINT "ai_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_holds" ADD CONSTRAINT "ai_holds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_ledger" ADD CONSTRAINT "ai_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_holds_user_id_index" ON "ai_holds" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_ledger_user_id_index" ON "ai_ledger" USING btree ("user_id");