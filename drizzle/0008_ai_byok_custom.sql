ALTER TABLE "ai_byok" DROP CONSTRAINT "ai_byok_provider_check";--> statement-breakpoint
ALTER TABLE "ai_byok" ADD COLUMN "base_url" text;--> statement-breakpoint
ALTER TABLE "ai_byok" ADD COLUMN "wire" text;--> statement-breakpoint
ALTER TABLE "ai_byok" ADD CONSTRAINT "ai_byok_custom_check" CHECK ((
        "ai_byok"."provider" = 'custom'
        and "ai_byok"."base_url" is not null
        and "ai_byok"."wire" in ('openai', 'anthropic')
      ) or (
        "ai_byok"."provider" <> 'custom'
        and "ai_byok"."base_url" is null
        and "ai_byok"."wire" is null
      ));--> statement-breakpoint
ALTER TABLE "ai_byok" ADD CONSTRAINT "ai_byok_provider_check" CHECK ("ai_byok"."provider" in ('openai', 'anthropic', 'google', 'deepseek', 'groq', 'bailian', 'openrouter', 'custom'));