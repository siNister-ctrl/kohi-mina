# ☕ Kohi Mina Cafe — Smart Cafe Management System

A full-stack POS & management system built for college capstone/thesis.

**Stack:** Next.js 15 · TypeScript · TailwindCSS v4 · Prisma v7 · Supabase (PostgreSQL) · Paymongo · NextAuth

---

## Features

- 🪑 QR-code ordering for 15 tables (no app download needed)
- 📋 Digital menu with categories, cart, checkout
- 👨‍💼 Admin dashboard — menu, users, inventory, QR codes, analytics, reports
- 💵 Cashier dashboard — order queue, cash & GCash payments
- ☕ Barista dashboard — live order board with status updates
- 📦 Inventory management with low-stock alerts
- 📊 Sales analytics & PDF/Excel report exports
- 💳 Paymongo GCash integration (webhook auto-confirms payment)

---

## Setup Guide

### 1. Clone & Install

```bash
git clone <repo>
cd kohi-mina-cafe
bun install        # or npm install
```

### 2. Supabase Database

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Connection String** from: Settings → Database → Connection string → URI
3. Copy the **Direct URL** too (same page, choose "Direct connection")

### 3. Environment Variables

Edit `.env.local`:

```env
# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# Paymongo (get from dashboard.paymongo.com)
PAYMONGO_SECRET_KEY="sk_test_..."
PAYMONGO_PUBLIC_KEY="pk_test_..."
PAYMONGO_WEBHOOK_SECRET="whsk_..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Update prisma.config.ts

Edit `prisma.config.ts` to point at your Supabase direct URL for migrations:

```ts
datasource: {
  url: process.env.DIRECT_URL!,
},
```

> ⚠️ Use `DIRECT_URL` (not pooled) for migrations. Use `DATABASE_URL` (pooled) for the app client.

### 5. Run Migrations

```bash
npx prisma migrate dev --name init
```

### 6. Seed Database

```bash
npm run db:seed
```

This creates:
- **Admin:** `admin@kohimina.com` / `admin123`
- **Cashier:** `cashier@kohimina.com` / `cashier123`  
- **Barista:** `barista@kohimina.com` / `barista123`
- 15 tables (Table 1–15) with QR codes
- Sample menu: Espresso, Latte, Cappuccino, Matcha Latte, Iced Coffee, Croissant, etc.
- Sample ingredients with stock levels

### 7. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Role-Based Access

| Role    | URL          | Access                              |
|---------|-------------|-------------------------------------|
| Admin   | `/admin`    | Full access — menu, users, inventory, analytics |
| Cashier | `/cashier`  | Order queue, payments               |
| Barista | `/barista`  | Order board, status updates         |
| Guest   | `/menu`     | Scan QR → browse menu → order       |

---

## GCash / Paymongo Setup

1. Create account at [dashboard.paymongo.com](https://dashboard.paymongo.com)
2. Get test API keys from Developers → API Keys
3. For webhook (auto-confirm payment):
   - Install [ngrok](https://ngrok.com): `ngrok http 3000`
   - Go to Paymongo → Developers → Webhooks → Add endpoint:
     - URL: `https://your-ngrok-url.ngrok.io/api/payments/webhook`
     - Events: `payment.paid`, `link.payment.paid`
   - Copy the webhook secret to `PAYMONGO_WEBHOOK_SECRET`

---

## Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add env vars in Vercel dashboard (Settings → Environment Variables)
# Set NEXT_PUBLIC_APP_URL to your Vercel URL
# Update NEXTAUTH_URL to your Vercel URL
# Update Paymongo webhook URL to your Vercel URL
```

> ⚠️ **Real-time note:** Socket.io persistent connections don't work on Vercel serverless. The cashier and barista dashboards use 5-second polling as fallback — orders refresh automatically every 5 seconds.

---

## Key Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio (DB GUI)
```

---

## Project Structure

```
app/
├── admin/          # Admin dashboard pages
├── barista/        # Barista order board
├── cashier/        # Cashier POS
├── menu/           # Customer-facing menu (QR entry)
├── order/[id]/     # Order confirmation page
├── auth/login/     # Login page
├── api/            # All API routes
│   ├── analytics/  # Sales analytics
│   ├── auth/       # NextAuth
│   ├── ingredients/# Inventory
│   ├── orders/     # Order management
│   ├── payments/   # GCash + webhook
│   ├── products/   # Menu items
│   ├── qr/         # QR code generation
│   ├── tables/     # Table management
│   └── users/      # Staff management
lib/
├── prisma.ts       # Prisma client singleton
prisma/
├── schema.prisma   # Database schema
├── seed.ts         # Seed data
└── migrations/     # Migration files
```
