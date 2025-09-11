CREATE TABLE "recent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"last_viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "recent_user_material_unique" UNIQUE("user_id","material_id")
);
--> statement-breakpoint
ALTER TABLE "recent" ADD CONSTRAINT "recent_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recent" ADD CONSTRAINT "recent_material_id_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."material"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recent_user_id_index" ON "recent" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recent_material_id_index" ON "recent" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "recent_last_viewed_index" ON "recent" USING btree ("last_viewed_at");