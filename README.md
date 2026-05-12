# Campus Bite

Order from your campus canteen in the browser: browse the menu, sign in, and skip the queue. Built with **Next.js (App Router)**, **Supabase Auth**, **shadcn/ui**, and **Tailwind CSS v4**.

## Features

- Landing experience with hero and bento “how it works” section  
- **Email + password** sign-in and sign-up (Supabase)  
- Protected routes via middleware; session helpers for server components  
- **Light / dark** theme (`next-themes`) with a compact toggle in the nav and on auth screens  
- **Floating** top navigation on scroll (fixed bar with blur and rounded shell)

## Prerequisites

- **Node.js** 20+ (LTS recommended)  
- A **Supabase** project with Authentication enabled (email provider)

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

3. **Auth redirect URL**

   In Supabase → **Authentication** → **URL Configuration** → **Redirect URLs**, add:

   - `http://localhost:3000/auth/callback`  
   - Your production callback URL when you deploy (same path).

4. **Run the dev server**

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
| `app/` | Routes: home, menu, login, signup, dashboard, admin, `auth/callback` |
| `components/ui/` | shadcn-style primitives (Button, Input, etc.) |
| `components/auth/` | Login/signup forms and shared auth UI |
| `components/layout/` | Navbar, footer, theme toggle |
| `components/landing/` | Hero, bento, decorative backgrounds |
| `lib/supabase/` | Browser Supabase client and env parsing |
| `lib/auth/` | Server actions (e.g. sign out) |
| `lib/session.ts` | Read session for RSC / layouts |
| `middleware.ts` | Session refresh and route protection |
| `styles/globals.css` | Design tokens and Tailwind theme |

## Conventional commits

This repo uses prefixes such as `feat`, `fix`, `chore`, `style`, `refactor`, and `docs` for clear history.

## Deploy

Deploy like any Next.js app (e.g. [Vercel](https://vercel.com)): set the same Supabase env vars and redirect URLs for your production domain.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)  
- [Supabase Auth](https://supabase.com/docs/guides/auth)  
- [shadcn/ui](https://ui.shadcn.com/)
