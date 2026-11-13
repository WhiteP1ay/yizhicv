CREATE TABLE "phone_code_cooldowns" (
	"phone" text PRIMARY KEY NOT NULL,
	"requested_at" timestamp with time zone NOT NULL
);
