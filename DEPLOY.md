# 🚀 Deploy to Vercel — Step by Step Guide

## Step 1 — GitHub Repository

1. GitHub par ek **new private/public repository** banayein (e.g. `digital-family-tree`).
2. Code push karein — do tarike:
   - **Option A (recommended):** Developer ko repo URL + PAT (fine-grained token, sirf us repo ke liye "Contents: Read and write" permission) dein — woh sandbox se push kar dega.
   - **Option B (khud push karein):**
     ```bash
     cd digital-khandaan
     git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
     git push -u origin main
     ```
     Note: `.env` aur `.env.vercel` push **nahi** honge (gitignored) — yeh bilkul theek hai.

## Step 2 — PostgreSQL Database (Neon.tech)

Vercel ke paas apna DB nahi hota — aapko ek Postgres chahiye:

1. [neon.tech](https://neon.tech) par free account banayein.
2. Naya project banayein → database ready hote hi **"Pooled connection string"** copy karein.
3. Woh string `DATABASE_URL` ban jayegi (`.env.vercel` mein line 1).

**Data kaise aayega:** Developer ke paas Neon DSN bhejein — woh sandbox se
`prisma migrate deploy` + `prisma db seed` chala kar saari 24 tables aur demo
data (admin + demo users, communities, events, photos) aapke Neon DB mein daal dega.
Is ke baad Vercel par sirf build karna hoga.

## Step 3 — Vercel Setup

1. [vercel.com](https://vercel.com) par login → **Add New → Project** → apna GitHub repo import karein.
2. **Framework Preset:** Next.js (auto-detect ho jayega)
3. **Build Command:** `npm run build` (default hi theek hai — `postinstall` script
   `prisma generate` khud chala deta hai)
4. **Environment Variables:** `.env.vercel` file ki **har line** Vercel ke
   Environment Variables section mein add karein (Production + Preview dono environments).
   - `YOUR-APP.vercel.app` ko apne actual Vercel URL se replace karein
   - `DATABASE_URL` mein apna Neon DSN lagayein
5. **Deploy** dabayein — ~2 minutes mein live ho jayega.

## Demo Login (after seed)

| Role  | Email                      | Password     |
|-------|----------------------------|--------------|
| Admin | admin@digitalkhandaan.pk   | Admin@12345  |
| User  | demo@digitalkhandaan.pk    | Demo@12345   |

## Important Notes

- **Google Login:** jab tak `GOOGLE_CLIENT_ID/SECRET` real nahi hote, Google
  button kaam nahi karega (credentials login use karein).
- **Media uploads:** Cloudinary configured hai — photos/videos wahan jayenge.
  Local fallback Vercel ke ephemeral filesystem mein kaam nahi karta (primary
  path Cloudinary hai, koi issue nahi).
- **Rate limiting:** in-memory hai (per-instance) — production scale ke liye
  Upstash Redis recommended hai.
- **Neo4j vars:** abhi reserved hain — core app PostgreSQL (Prisma) use karta hai.
- **Seed photos:** repo ke andar `public/uploads/seed/` mein hain — Vercel par
  automatically serve hongi.
