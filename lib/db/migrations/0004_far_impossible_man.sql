CREATE TABLE "addons" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"price" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_addons" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer,
	"transaction_id" integer,
	"addon_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price_at_purchase" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "setup_minutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "stations" ADD COLUMN "coins_per_hour" integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "comment" text;--> statement-breakpoint
ALTER TABLE "session_addons" ADD CONSTRAINT "session_addons_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_addons" ADD CONSTRAINT "session_addons_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_addons" ADD CONSTRAINT "session_addons_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE no action ON UPDATE no action;