# 💿 Sweet Spin Records

A pastel, mobile-first record store for vinyl, CDs and cassettes. Shoppers browse a crate of records (each one a spinning vinyl with the cover art as its label), and shop owners log in to manage the catalogue. Built with **React, Vite and Supabase**.

<!-- Add screenshots to /docs and uncomment:
![Storefront](docs/storefront.png)
![Admin](docs/admin.png)
-->

## Features

**Storefront (public)**
- Browse products pulled live from Supabase, with category tabs and search
- Product detail pop-up, add-to-crate, quantity controls and a checkout summary (demo, no payment)
- Responsive design: top navigation on desktop, app-style bottom tab bar on phones

**Admin (login required)**
- Supabase email/password authentication (sign up, log in, log out) with protected routes
- Full CRUD for products, categories and suppliers
- Cover image upload to Supabase Storage
- Table rows collapse into stacked cards on small screens

## Tech stack

| Area | Tools |
| --- | --- |
| Frontend | React 19, React Router, Vite |
| Backend | Supabase (Postgres, Auth, Storage, Row Level Security) |
| Styling | Hand-written CSS with design tokens, no UI framework |

## Getting started

```bash
git clone https://github.com/<your-username>/sweet-spin-records.git
cd sweet-spin-records
npm install
cp .env.example .env      # then add your Supabase URL and anon key
npm run dev
```

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run [`supabase/schema.sql`](supabase/schema.sql). This creates the tables, security policies and the `product-images` storage bucket.
3. Put your project URL and anon key (Project Settings → API) in `.env`.
4. Run the app, sign up on the **Log in** page, then add categories and products from **Admin**.

## Project structure

```
src/
  App.jsx          routes, header, session hook, vinyl component
  Store.jsx        public storefront, product modal, crate
  Auth.jsx         login and sign up
  Admin.jsx        reusable CRUD manager + products / categories / suppliers
  supabaseClient.js
supabase/schema.sql  database schema and security policies
```

## Security notes

- Credentials live in `.env` (git-ignored). The Supabase **anon** key is designed to be public, so access is protected by Row Level Security: anyone can read the catalogue, only authenticated users can write.
- Currently any signed-in user is treated as an admin. For production, add a `role` column or an allow-list and tighten the write policies.

## Roadmap

- [ ] Admin-only role check
- [ ] Real checkout with Stripe
- [ ] Order history table
- [ ] Image optimisation

## Deploying

`npm run build` outputs a static site in `dist/` (uses hash routing, so it works on GitHub Pages, Netlify or Vercel without extra config). Set the two `VITE_` variables in your host's settings.

---
Made by Isabelle Wenceslao
