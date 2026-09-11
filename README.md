# 🌳 Digital Khandaan

**Pakistan ka pehla complete digital family platform** — Events, Clans, Rishta, Jobs, Business Directory, Memories, Media, Buzurg Mode, Kids Zone, 2FA Security aur bohat kuch, sab aik jagah.

Built with **Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL + NextAuth v5 + Tailwind CSS + shadcn/ui**.

---

## ✨ Features (17 + Admin Panel)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Landing Page** | Marketing landing with live DB stats, features, testimonials, contact |
| 2 | **Register / Login** | Email+password (bcrypt 12 rounds), Google OAuth, 30 Pakistani cities dropdown, password strength meter |
| 3 | **Dashboard** | Stats, upcoming events, recent activity, live login-log recording |
| 4 | **Events** | 31 event types (Urdu labels + emoji), RSVP (Going/Maybe/Not Going), create/edit/delete, recurring events, cover images |
| 5 | **Community / Clan / Sub-Clan** | 10 communities, clans, sub-clans, join requests with approve/reject |
| 6 | **Rishta** | Profiles with privacy (photos visible to verified only), search filters, requests inbox with accept/reject |
| 7 | **Jobs** | Job postings, applications, job profiles (skills, experience, education) |
| 8 | **Business Directory** | Family businesses, reviews, ratings, verification |
| 9 | **Memories** | Timeline + grid, categories, "On This Day" |
| 10 | **Media** | Uploads (Cloudinary or local), type validation + magic bytes, 5GB quota |
| 11 | **Profile** | Public profile, edit, avatars, job profile editor |
| 12 | **Settings** | 6 tabs: account (OTP email/phone change), privacy, notifications, language, theme, security |
| 13 | **Security** | Rate limiting (5/15min), security headers, CSP, sanitization, audit logs |
| 14 | **2FA** | TOTP via QR code (Speakeasy), 10 backup codes, enable/verify/disable |
| 15 | **Buzurg Mode** | Senior-friendly UI, medicine reminders, big buttons |
| 16 | **Kids Mode** | Password gate, family quiz (real DB photos), points + badges |
| 17 | **Notifications** | Real-time style notification center with tabs + cursor pagination |
| 18 | **Admin Panel** | 12 sub-pages: Dashboard (Recharts), Users, Clans, Events, Reports, Businesses, Rishta, Jobs, Media, Settings, Audit Log, Contact Messages |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17+
- PostgreSQL 14+ (or a [Neon.tech](https://neon.tech) database)

### 1. Install

```bash
npm install
```

### 2. Environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL DSN (local or Neon) |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | e.g. `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional | Google OAuth (Google login) |
| `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET` | optional | Media uploads to Cloudinary (falls back to local `/public/uploads`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | optional | Emails (OTP, welcome, etc. — logged to console when unset) |
| `NEXT_PUBLIC_APP_NAME` | ✅ | `Digital Khandaan` |
| `NEXT_PUBLIC_APP_URL` | ✅ | e.g. `http://localhost:3000` |

### 3. Database

```bash
npx prisma migrate dev      # create tables
npx prisma db seed          # seed admin + demo users + sample data
```

### 4. Run

```bash
npm run dev      # development — http://localhost:3000
npm run build    # production build
npm start        # production server
```

### Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@digitalkhandaan.pk` | `Admin@12345` |
| Demo user | `demo@digitalkhandaan.pk` | `Demo@12345` |

> Kids Mode gate password: `family123`

---

## 🧱 Tech Stack

- **Framework:** Next.js 14.2 (App Router), TypeScript 5.5 (strict)
- **UI:** Tailwind CSS 3.4, shadcn/ui (New York, Slate), Framer Motion 11, Lucide React, Recharts 2
- **Forms:** React Hook Form 7 + Zod 3
- **State:** Zustand 4, Sonner toasts
- **Auth:** NextAuth 5.0.0-beta.19 (JWT sessions, Credentials + Google), bcryptjs (12 rounds), Speakeasy 2FA
- **DB:** Prisma ORM 5.17 + PostgreSQL
- **Misc:** date-fns 3, Nodemailer 6, Cloudinary 2, QRCode 1.5, ua-parser-js 1

---

## 📁 Project Structure

```
digital-khandaan/
├── prisma/
│   ├── schema.prisma        # 24 models (spec-verbatim)
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/                 # App Router pages + API routes
│   │   ├── (auth)/          # login, register, forgot/reset password
│   │   ├── (main)/          # dashboard, events, community, rishta, jobs,
│   │   │                    # business, memories, media, profile, settings,
│   │   │                    # notifications, buzurg, kids
│   │   ├── admin/           # admin panel (12 sub-pages)
│   │   └── api/             # 48+ API routes (Zod-validated, auth-guarded)
│   ├── components/
│   │   ├── ui/              # 24 shadcn primitives
│   │   ├── shared/          # sidebar, navbar, empty-state, notification bell…
│   │   ├── landing/         # 9 landing sections
│   │   └── admin/           # admin sidebar + stats
│   ├── hooks/               # use-debounce, use-media-query…
│   ├── lib/                 # constants, validators, db, auth, api, utils,
│   │                        # cloudinary, email
│   ├── stores/              # Zustand app store
│   └── types/               # shared TypeScript types
├── middleware.ts            # auth + admin route guards
├── next.config.mjs          # CSP + security headers
├── tailwind.config.ts
└── .env.example
```

---

## 🔐 Security

- bcryptjs with 12 salt rounds — passwords never returned by any API
- NextAuth v5 JWT sessions; all API routes protected (`requireUser` / `requireAdmin`)
- Auth endpoints rate-limited: 5 attempts / 15 minutes
- Input sanitization on all writes, Zod validation in every route
- Upload validation: type + size + magic bytes; 5GB per-user quota
- Security headers + CSP in `next.config.mjs`
- All admin/mutating operations written to the Audit Log (device, browser, OS, IP via ua-parser-js)
- Email/phone changes require a 6-digit OTP (10-minute expiry)

---

## 🗄️ Database

24 models: `User`, `Account`, `Session`, `VerificationToken`, `Community`, `Clan`, `SubClan`, `Event`, `EventRSVP`, `Memory`, `Media`, `JobProfile`, `JobPosting`, `JobApplication`, `Business`, `BusinessReview`, `RishtaProfile`, `RishtaRequest`, `Notification`, `Report`, `AuditLog`, `SiteSettings`, `ContactMessage` + enums (`Role`, `Gender`, `EventType` with 31 values, `RSVPStatus`, `MemoryCategory`, `MediaType`, `JobType`, `ApplicationStatus`, `RishtaStatus`, `ReportStatus`).

Indexes on frequently queried fields, cursor-based pagination everywhere, transactions for multi-step operations.

---

## 📜 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Production server |
| `npm run lint` | ESLint |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Prisma Studio |

---

## 📄 License

Private project — Digital Khandaan © 2025. All rights reserved.
