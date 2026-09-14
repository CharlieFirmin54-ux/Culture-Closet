# Culture Closet

Streetwear storefront for Culture Closet — footwear, tracksuits, and accessories with Apple Pay / Google Pay checkout, inventory admin, and in-person POS.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- Stripe Payment Request Button (Apple Pay / Google Pay)
- File-backed product store (`data/store.json`, generated from seed on first run)

## Setup

```bash
npm install
cp .env.example .env.local
# set AUTH_SECRET and Stripe keys in .env.local
npm run dev
```

Demo logins (from seed):

- Admin: `admin@culturecloset.com` / `culture123`
- Customer: `demo@culturecloset.com` / `culture123`

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm start` — run production server
