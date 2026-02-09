CREATE INDEX "material_creator_id_idx" ON "material" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "material_target_course_id_idx" ON "material" USING btree ("target_course");--> statement-breakpoint
CREATE INDEX "material_tags_idx" ON "material" USING btree ("tags");