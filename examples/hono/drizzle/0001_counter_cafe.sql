CREATE TYPE "public"."counter_order_status" AS ENUM('PLACED', 'BREWING', 'READY', 'PICKED_UP', 'CANCELLED');
--> statement-breakpoint
CREATE TYPE "public"."counter_drink_size" AS ENUM('SHORT', 'TALL', 'GRANDE');
--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "memo" TO "note";
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "drink" text DEFAULT 'Coffee' NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "size" "counter_drink_size" DEFAULT 'TALL' NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "counter_order_status" USING (
	CASE "status"::text
		WHEN 'PENDING' THEN 'PLACED'
		WHEN 'PAID' THEN 'BREWING'
		WHEN 'SHIPPED' THEN 'READY'
		WHEN 'CANCELLED' THEN 'CANCELLED'
	END::"counter_order_status"
);
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PLACED';
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "drink" DROP DEFAULT;
--> statement-breakpoint
DROP TYPE "public"."order_status";
