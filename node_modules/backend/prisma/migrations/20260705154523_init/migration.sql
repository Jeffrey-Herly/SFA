-- CreateEnum
CREATE TYPE "Role" AS ENUM ('sales_rep', 'sales_manager', 'admin', 'executive');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'qualified', 'converted', 'dead');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('web_form', 'manual', 'referral', 'import');

-- CreateEnum
CREATE TYPE "OpportunityStage" AS ENUM ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('call', 'email', 'meeting', 'note', 'status_change');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('draft', 'submitted', 'approved', 'processing', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "TargetPeriod" AS ENUM ('monthly', 'quarterly', 'yearly');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "password" VARCHAR NOT NULL,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "email" VARCHAR,
    "phone" VARCHAR,
    "interest" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "source" "LeadSource" NOT NULL DEFAULT 'manual',
    "created_by" UUID,
    "assigned_to" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" UUID NOT NULL,
    "title" VARCHAR NOT NULL,
    "lead_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "stage" "OpportunityStage" NOT NULL DEFAULT 'prospecting',
    "amount" DECIMAL(15,2) NOT NULL,
    "probability" INTEGER NOT NULL DEFAULT 0,
    "expected_close" DATE NOT NULL,
    "loss_reason" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "company_name" VARCHAR NOT NULL,
    "industry" VARCHAR,
    "website" VARCHAR,
    "address" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "email" VARCHAR,
    "phone" VARCHAR,
    "position" VARCHAR,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "lead_id" UUID,
    "opportunity_id" UUID,
    "contact_id" UUID,
    "account_id" UUID,
    "type" "ActivityType" NOT NULL,
    "notes" TEXT,
    "meta" JSONB,
    "activity_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "order_number" VARCHAR NOT NULL,
    "account_id" UUID NOT NULL,
    "opportunity_id" UUID,
    "salesperson_id" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'draft',
    "order_date" DATE NOT NULL,
    "delivery_date" DATE,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_name" VARCHAR NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "targets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "period_type" "TargetPeriod" NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "target_amount" DECIMAL(15,2) NOT NULL,
    "target_visits" INTEGER NOT NULL,
    "target_new_leads" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_salesperson_id_fkey" FOREIGN KEY ("salesperson_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "targets" ADD CONSTRAINT "targets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
