# Kohi Mina Cafe — Build Tracker

## Stack
- Next.js 14 App Router + TypeScript + TailwindCSS
- Prisma + Supabase (PostgreSQL)
- NextAuth (credentials)
- Socket.io (real-time)
- Paymongo (GCash)
- Vercel deployment target

## Progress

### ✅ Done
- [x] Project scaffold
- [x] All dependencies
- [x] Prisma schema
- [x] Seed data
- [x] .env.local + .env.example
- [x] lib/prisma.ts, auth.ts, utils.ts, socket.ts
- [x] app/layout.tsx, globals.css, providers.tsx
- [x] app/page.tsx (landing)
- [x] app/auth/login/page.tsx
- [x] API: auth, products, categories, tables, orders, payments/gcash, payments/webhook, ingredients, analytics, qr, users
- [x] app/menu/page.tsx (customer menu + cart)
- [x] app/order/[id]/page.tsx (order tracking)

### 🔄 Next Up
- [ ] Cashier dashboard (/cashier)
- [ ] Barista/KDS (/barista)
- [ ] Admin panel (/admin) + sub-pages
- [ ] Socket.io server-side handler
- [ ] QR codes page
- [ ] Reports (PDF/Excel)
- [ ] tailwind.config.ts + next.config.ts
- [ ] package.json seed script
- [ ] .gitignore, README, deployment guide
