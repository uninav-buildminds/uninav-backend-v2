CREATE TYPE "public"."error_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."error_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TABLE "error_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"error_type" varchar(100) NOT NULL,
	"severity" "error_severity" DEFAULT 'medium' NOT NULL,
	"status" "error_status" DEFAULT 'open' NOT NULL,
	"metadata" jsonb,
	"error_details" jsonb,
	"user_agent" text,
	"url" text,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "error_reports" ADD CONSTRAINT "error_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_reports" ADD CONSTRAINT "error_reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "error_reports_user_id_index" ON "error_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "error_reports_error_type_index" ON "error_reports" USING btree ("error_type");--> statement-breakpoint
CREATE INDEX "error_reports_severity_index" ON "error_reports" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "error_reports_status_index" ON "error_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "error_reports_created_at_index" ON "error_reports" USING btree ("created_at");