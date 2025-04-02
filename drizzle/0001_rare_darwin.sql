CREATE TABLE "resource" (
	"materialId" uuid PRIMARY KEY NOT NULL,
	"resourceAddress" text NOT NULL,
	"resourceType" "resourceType",
	"metaData" text[]
);
--> statement-breakpoint
ALTER TABLE "resource" ADD CONSTRAINT "resource_materialId_material_id_fk" FOREIGN KEY ("materialId") REFERENCES "public"."material"("id") ON DELETE cascade ON UPDATE no action;