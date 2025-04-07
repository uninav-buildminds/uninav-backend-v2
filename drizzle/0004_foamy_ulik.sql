CREATE TABLE "material_likes" (
	"material_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "material_likes_material_id_user_id_pk" PRIMARY KEY("material_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "blog_likes" (
	"blogId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_likes_blogId_userId_pk" PRIMARY KEY("blogId","userId")
);
--> statement-breakpoint
ALTER TABLE "blogs" RENAME COLUMN "body" TO "bodyAddress";--> statement-breakpoint
ALTER TABLE "blogs" ADD COLUMN "headingAddress" text NOT NULL;--> statement-breakpoint
ALTER TABLE "blogs" ADD COLUMN "headingImageKey" text;--> statement-breakpoint
ALTER TABLE "blogs" ADD COLUMN "bodyKey" text;--> statement-breakpoint
ALTER TABLE "blogs" ADD COLUMN "views" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "blogs" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "material_likes" ADD CONSTRAINT "material_likes_material_id_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."material"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_likes" ADD CONSTRAINT "material_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_likes" ADD CONSTRAINT "blog_likes_blogId_blogs_id_fk" FOREIGN KEY ("blogId") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_likes" ADD CONSTRAINT "blog_likes_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;