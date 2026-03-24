ALTER TABLE "scans" ADD COLUMN "statuses" jsonb;--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN "pipeline_sent" jsonb;