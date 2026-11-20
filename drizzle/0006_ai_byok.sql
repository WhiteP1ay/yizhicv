CREATE TABLE "ai_byok" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"key_ciphertext" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_byok_provider_check" CHECK ("ai_byok"."provider" in ('openai', 'anthropic', 'google', 'deepseek', 'groq'))
);
--> statement-breakpoint
ALTER TABLE "ai_byok" ADD CONSTRAINT "ai_byok_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;