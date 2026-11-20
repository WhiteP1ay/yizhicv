DELETE FROM "ai_byok" WHERE "provider" = 'custom';--> statement-breakpoint
ALTER TABLE "ai_byok" DROP CONSTRAINT "ai_byok_custom_check";--> statement-breakpoint
ALTER TABLE "ai_byok" DROP CONSTRAINT "ai_byok_provider_check";--> statement-breakpoint
ALTER TABLE "ai_byok" DROP COLUMN "base_url";--> statement-breakpoint
ALTER TABLE "ai_byok" DROP COLUMN "wire";--> statement-breakpoint
ALTER TABLE "ai_byok" ADD CONSTRAINT "ai_byok_provider_check" CHECK ("ai_byok"."provider" in ('openai', 'anthropic', 'google', 'deepseek', 'groq', 'bailian', 'siliconflow', 'openrouter'));