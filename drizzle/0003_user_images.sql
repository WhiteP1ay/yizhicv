CREATE TABLE "user_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"object_key" text NOT NULL,
	"byte_size" integer NOT NULL,
	"content_type" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_images_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "user_images_status_check" CHECK ("user_images"."status" in ('pending', 'ready'))
);
--> statement-breakpoint
ALTER TABLE "user_images" ADD CONSTRAINT "user_images_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_images_user_id_index" ON "user_images" USING btree ("user_id");