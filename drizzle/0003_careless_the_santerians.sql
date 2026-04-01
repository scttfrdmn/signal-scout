CREATE TABLE "prompt_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text,
	"body" text NOT NULL,
	"focus_area_instruction" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"activated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN "is_lab" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN "prompt_version_id" text;