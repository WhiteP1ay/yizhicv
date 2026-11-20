CREATE TABLE "resumes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"document" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "resumes_user_id_updated_at_index" ON "resumes" USING btree ("user_id","updated_at");