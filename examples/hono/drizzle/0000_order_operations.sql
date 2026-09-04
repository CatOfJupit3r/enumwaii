CREATE TYPE "public"."counter_order_status" AS ENUM('PLACED', 'BREWING', 'READY', 'PICKED_UP', 'CANCELLED');
--> statement-breakpoint
CREATE TYPE "public"."counter_drink_size" AS ENUM('SHORT', 'TALL', 'GRANDE');
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"status" "counter_order_status" DEFAULT 'PLACED' NOT NULL,
	"drink" text NOT NULL,
	"size" "counter_drink_size" DEFAULT 'TALL' NOT NULL,
	"note" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_version_positive" CHECK ("orders"."version" > 0)
);
