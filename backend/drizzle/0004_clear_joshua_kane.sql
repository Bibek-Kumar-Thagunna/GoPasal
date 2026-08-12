CREATE TYPE "public"."rider_status" AS ENUM('OFFLINE', 'ONLINE', 'BUSY');--> statement-breakpoint
CREATE TYPE "public"."delivery_task_status" AS ENUM('PENDING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "delivery_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"rider_id" text,
	"status" "delivery_task_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_tasks_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "riders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"vehicle_type" varchar(50) NOT NULL,
	"license_plate" varchar(50) NOT NULL,
	"status" "rider_status" DEFAULT 'OFFLINE' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"current_lat" real,
	"current_lon" real,
	"last_location_update" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD CONSTRAINT "delivery_tasks_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD CONSTRAINT "delivery_tasks_rider_id_riders_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."riders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riders" ADD CONSTRAINT "riders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tasks_status" ON "delivery_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tasks_rider" ON "delivery_tasks" USING btree ("rider_id");--> statement-breakpoint
CREATE INDEX "idx_riders_user" ON "riders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_riders_status" ON "riders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_riders_location" ON "riders" USING btree ("current_lat","current_lon");