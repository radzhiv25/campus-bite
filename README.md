# Campus Bite

Order from your campus canteen in the browser: browse the menu, sign in, and skip the queue. Built with **Next.js (App Router)**, **Supabase Auth**, **shadcn/ui**, and **Tailwind CSS v4**.

## Features

- Landing experience with hero and bento “how it works” section  
- **Email + password** sign-in and sign-up (Supabase)  
- Protected routes via middleware; session helpers for server components  
- **Light / dark** theme (`next-themes`) with a compact toggle in the nav and on auth screens  
- **Floating** top navigation on scroll (fixed bar with blur and rounded shell)  
- **Canteen menu** (`/menu`): dishes from Supabase `menu_items` with **search**, **filters**, **grid or list** layout, and **cart controls** (quantities sync to the nav badge and **`/cart`** review page)  
- **Admin menu management**: users with `app_metadata.role = "admin"` can add/remove items from **Dashboard** or **`/admin`**; changes show on the menu immediately

## Prerequisites

- **Node.js** 20+ (LTS recommended)  
- A **Supabase** project with Authentication enabled (email provider)  
- A `public.menu_items` table (and optional `profiles`) with Row Level Security matching how you deploy the app

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables**

   Copy the example file and fill in your project keys (Dashboard → **Project Settings** → **API**):

   ```bash
   cp .env.example .env.local
   ```

   Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or the publishable key variant described in `.env.example`).

3. **Database**

   Create `public.menu_items` (and any profile tables you use) in Supabase with policies that match your deployment: typically **public read** on the menu and **writes restricted to admins** (for example via JWT `app_metadata.role = "admin"`). Apply the SQL in your own migration tool or the Supabase SQL editor.

   For **photo uploads** from the admin “Add dish” dialog, create a **public** Storage bucket named **`menu-images`**. Add policies so everyone can **read** objects (for the public menu) and authenticated **admins** can **upload** to the `items/` path. If the bucket is missing, you can still save items using an **https://** image URL only.

4. **Grant admin to your account**

   In Supabase → **Authentication** → **Users** → choose your user → **Edit user** (or raw JSON) and set **App metadata** to include:

   ```json
   { "role": "admin" }
   ```

   Sign out and sign in again so the new JWT is issued. You will then see **Admin** in the nav and can manage items on **Dashboard** or **`/admin`**.

5. **Auth redirect URL**

   In Supabase → **Authentication** → **URL Configuration** → **Redirect URLs**, add:

   - `http://localhost:3000/auth/callback`  
   - Your production callback URL when you deploy (same path).

6. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start Next.js in dev mode |
| `npm run build` | Production build        |
| `npm run start` | Run production server   |
| `npm run lint`  | ESLint                  |

## Project layout (high level)

| Path | Role |
| ---- | ---- |
| `app/` | Routes: home, **menu**, **cart**, login, signup, dashboard, **admin**, `auth/callback` |
| `components/ui/` | shadcn-style primitives (Button, Input, etc.) |
| `components/auth/` | Login/signup forms and shared auth UI |
| `components/layout/` | Navbar (with cart link), footer, theme toggle |
| `components/cart/` | Cart review page UI |
| `components/landing/` | Hero, bento, decorative backgrounds |
| `components/menu/` | Menu browser (search, filters, grid/list), item cards, cart context |
| `components/dashboard/` | Dashboard shell and admin menu tools |
| `lib/menu/` | Menu types, Supabase queries, server actions |
| `lib/supabase/` | Browser Supabase client and env parsing |
| `lib/auth/` | Server actions (e.g. sign out) |
| `lib/session.ts` | Read session for RSC / layouts |
| `middleware.ts` | Session refresh and route protection |
| `styles/globals.css` | Design tokens and Tailwind theme |

## Conventional commits

This repo uses prefixes such as `feat`, `fix`, `chore`, `style`, `refactor`, and `docs` for clear history.

## Optional: student ID scan at signup

Signup offers **Manual** or **Scan student ID** (webcam or file upload). OCR runs on the server; images are not stored.

| Variable | Purpose |
| -------- | ------- |
| `GOOGLE_CLOUD_VISION_API_KEY` | **Recommended** — Google Cloud Vision text detection (~1,000 free units/month). Enable the Vision API and create an API key. |
| `ID_SCAN_PROVIDER` | Optional: `google` or `tesseract`. Default: Google if the key is set, otherwise **Tesseract** (local, free, less accurate on ID photos). |
| `ID_SCAN_FALLBACK_TESSERACT` | Optional: set to `true` to fall back to Tesseract if Google Vision fails. |

Without any key, **Tesseract** is used automatically (no extra setup, slower, review fields manually).

## Online payments (Razorpay)

Checkout supports **pay at counter** or **pay online** via [Razorpay](https://razorpay.com/). Use **Test Mode** keys from Dashboard → **API Keys** for local development.

| Variable | Purpose |
| -------- | ------- |
| `RAZORPAY_KEY_ID` | Razorpay Key ID (test or live) — returned to the browser for Checkout |
| `RAZORPAY_KEY_SECRET` | Secret key — server only; creates orders and verifies payment signatures |

If these are unset, only pay-at-counter is offered. After placing a Razorpay order, run the SQL in `supabase/sql/orders.sql` (including `orders_update_own_razorpay_payment`) so students can mark their own payment as paid via `/api/payments/razorpay/verify`.

**Test checkout:** use test keys, place an order with **Pay online**, and in the Razorpay modal use test card `4111 1111 1111 1111`, any future expiry, any CVV, and OTP `1234` (or other values shown in the Razorpay test docs).

## Deploy

Deploy like any Next.js app (e.g. [Vercel](https://vercel.com)): set the same Supabase env vars and redirect URLs for your production domain.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)  
- [Supabase Auth](https://supabase.com/docs/guides/auth)  
- [shadcn/ui](https://ui.shadcn.com/)
