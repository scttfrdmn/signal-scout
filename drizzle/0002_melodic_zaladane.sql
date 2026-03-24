CREATE TABLE "saved_searches" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"focus_area" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
