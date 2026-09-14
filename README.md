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

## Assets

- `public/products/*.jpg` — 34 catalog images (Unsplash stand-ins matching the original download map).
- `public/brand/firmin-mark-sm.png` and `firmin-lockup-md.png` — **placeholders**. Original Firmin Systems logos were user uploads in the source agent and could not be recovered (artifact URLs require auth; `Culture_Closet_Offline.zip` / `OPEN_ME_Culture_Closet.html` downloads returned login HTML).

## Notes

- Copy `.env.example` → `.env.local` and set secrets locally. Do not commit `.env` or `data/store.json`.
- Demo checkout works without Stripe; real Apple Pay / Google Pay need Stripe keys + domain verification.

