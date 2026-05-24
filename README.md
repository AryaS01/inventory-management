# Inventory Management

Built this as a take-home exercise for Allo. It's a multi-warehouse inventory system where customers can reserve stock during checkout instead of it getting oversold.

## What it does

- Browse products and see stock levels per warehouse
- Reserve units for 10 minutes while you complete payment
- Confirm or cancel the reservation
- If you close the tab or the timer runs out, stock is automatically released

## Running it locally

Clone the repo, then:

```bash
npm install
```

Create a `.env` file with:

```env
DATABASE_URL="your-supabase-pooled-url"
DIRECT_URL="your-supabase-direct-url"
CRON_SECRET="any-secret-string"
```

Then set up the database:

```bash
npx prisma migrate dev
npx prisma db seed
```

Start the server:

```bash
npm run dev
```

## The hard part — race conditions

If two people try to reserve the last unit at the same time, exactly one should succeed. I handled this with a Postgres row-level lock inside a transaction:

```sql
SELECT id, total, reserved FROM "StockLevel" WHERE id = ? FOR UPDATE
```

The `FOR UPDATE` locks the row. The second request blocks until the first transaction finishes, then reads the updated numbers and gets a 409 if there's nothing left.

The stock model is simple:

available = total - reserved

Reserving increments `reserved`. Confirming decrements both `total` and `reserved`. Cancelling only decrements `reserved`.

## How expiry works

Three layers, each catching what the previous one misses:

**1. Frontend timer** — the reservation page counts down. When it hits zero it calls the release API and tells the user their reservation expired.

**2. Confirm-time check** — even if the frontend somehow missed it, the confirm endpoint checks `expiresAt` and returns 410 if it's past.

**3. Cron job** — runs every 5 minutes on Vercel, finds all PENDING reservations past their expiry and releases them. This is the safety net for users who just close the tab.

## Things I'd do differently with more time

**Real-time stock updates** — right now the products page polls every 5 seconds with `router.refresh()`. Works fine but WebSockets would be cleaner.

**Authentication** — reservations aren't tied to a user right now. Anyone with a reservation ID could confirm it. In production you'd tie reservations to a session.

**Idempotency** — if a network hiccup causes a retry, you'd get duplicate reservations. The fix is checking an `Idempotency-Key` header and returning the cached response. I ran out of time for this one.

## Stack

Next.js 15, Prisma 7, Supabase, Tailwind, Vercel