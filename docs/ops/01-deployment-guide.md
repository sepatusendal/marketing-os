# Deployment Guide

Stack: Next.js (App Router) di **Vercel**, database + auth di **Supabase**, source code di
**GitHub**. Dua environment: `marketingos-dev` (Preview/local) dan `marketingos-prod`
(Production).

Ini urutan setup dari nol. Kalau project udah jalan dan lo cuma mau tau cara edit sesuatu, ke
[Manual Config Guide](./02-manual-config-guide.md) aja.

---

## 1. Setup Supabase (lakuin 2x — dev dan prod)

Buat **dua project Supabase terpisah**: `marketingos-dev` dan `marketingos-prod`. Jangan pernah
pakai satu project buat dua-duanya — data testing bisa kecampur sama data asli.

Per project:

1. **Buat project baru** di [supabase.com/dashboard](https://supabase.com/dashboard), simpan
   password database-nya di password manager.
2. **Authentication → Providers → Email** → matikan toggle **"Allow new users to sign up"**.
   Aplikasi ini invite-only — orang cuma bisa punya akun kalau di-invite oleh Owner/Admin.
3. **Storage** → bikin bucket namanya `assets`, set **private**, file size limit **25 MB**.
4. Catat dari **Settings → API**: Project URL, `anon` key, `service_role` key (format JWT,
   panjang, diawali `eyJ...` — bukan yang format baru `sb_publishable_...`/`sb_secret_...`, kode
   project ini pakai format lama).
5. Catat dari **Settings → Database → Connection string**:
   - **Pooled** (port `6543`, ada `pgbouncer=true`) — dipakai aplikasi jalan normal.
   - **Direct** (port `5432`, tanpa `pgbouncer`) — dipakai cuma buat migrasi database.

## 2. Setup Vercel

1. **Import repo** dari GitHub ke Vercel project baru.
2. Sebelum deploy pertama, isi **Environment Variables** (Settings → Environment Variables).
   Tiap key kecuali `APP_BASE_URL` butuh **2 entry beda scope**: Production (pakai kredensial
   prod) dan Development (pakai kredensial dev). Kalau UI Vercel nggak bisa multi-select scope
   dalam satu entry, tambahin entry ketiga scope **Preview** dengan value yang sama kayak
   Development.

   | Key | Isi |
   |---|---|
   | `DATABASE_URL` | Pooled connection string + `&connection_limit=5` di akhir |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL (base URL doang, **tanpa** `/rest/v1/`) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
   | `APP_BASE_URL` | Domain final buat scope itu (lihat catatan di bawah) |
   | `RESEND_API_KEY` | Opsional — skip kalau belum mau setup email |
   | `EMAIL_FROM` | Opsional, sepasang sama `RESEND_API_KEY` |

   > **`connection_limit`**: jangan set `1`. Dashboard app ini nembak banyak query paralel per
   > halaman — `connection_limit=1` bikin query saling antre dan timeout (`P2024`, lihat
   > [Troubleshooting](./03-troubleshooting.md)). `5` udah cukup buat traffic internal tool ini.

   > **`APP_BASE_URL`**: harus domain FINAL yang beneran dipakai orang buat akses app (custom
   > domain kalau udah ada, atau domain `*.vercel.app` bawaan Vercel kalau belum). Dipakai buat
   > bikin link invite di email — kalau salah, link invite yang dikirim ke user baru bakal nunjuk
   > ke domain yang salah.

   > **`DIRECT_URL` TIDAK masuk sini** — itu cuma dipakai `prisma migrate`, bukan runtime app.
   > Lihat langkah GitHub di bawah.

3. Klik **Deploy**.
4. Aktifkan **Vercel Deployment Protection** buat Preview deployment (Settings → Deployment
   Protection) — ini internal tool, preview URL nggak perlu diakses publik.

## 3. Setup GitHub Secret buat migrasi database

Ada workflow `.github/workflows/migrate-prod.yml` yang jalanin `prisma migrate deploy` ke
database production. Dia butuh secret:

1. Repo GitHub → **Settings → Secrets and variables → Actions → New repository secret**
2. Name: `PROD_DIRECT_URL`
3. Value: **direct** connection string (port `5432`) dari Supabase **prod**

Workflow ini otomatis jalan tiap ada push ke `main` yang nyentuh folder `prisma/migrations/**`.
Buat trigger manual (misal migrasi pertama kali, atau migration folder-nya udah lama di-commit
sebelum secret ini ada): repo GitHub → tab **Actions** → pilih workflow **migrate-prod** →
**Run workflow**.

## 4. Setup domain custom (opsional, kalau punya)

1. Vercel project → **Settings → Domains** → tambahin domain, ikutin instruksi DNS-nya (biasanya
   nambahin CNAME/A record di DNS provider domain lo).
2. Setelah domain aktif, **update semua tempat yang masih nunjuk ke domain lama**:
   - Vercel `APP_BASE_URL` (scope Production) → domain baru, lalu **Redeploy**
   - Supabase (prod) → **Authentication → URL Configuration**:
     - **Site URL** → domain baru, **root doang, jangan ada path** (misal `/login`) di
       belakangnya
     - **Redirect URLs** → tambahin `https://domain-baru/invite/accept` dan
       `https://domain-baru/api/auth/callback`
   - Kalau Google Sign-In udah aktif, redirect URI di Google Cloud Console **tidak perlu**
     diubah (itu nunjuk ke Supabase, bukan ke app kita, jadi nggak kena dampak ganti domain).

## 5. Setup Google Sign-In (opsional)

1. **Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com)) →
   pilih/bikin project → **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Kalau diminta, isi **OAuth consent screen** dulu (App name bebas, internal use)
   - Application type: **Web application**
   - **Authorized redirect URIs** (bukan "Authorized JavaScript origins" — itu field beda dan
     nggak nerima path) → isi:
     ```
     https://<project-ref>.supabase.co/auth/v1/callback
     ```
   - Catat **Client ID** dan **Client Secret** yang di-generate
2. **Supabase (prod) → Authentication → Sign In / Providers → Google** → Enable, paste Client ID
   & Client Secret dari Google, Save.
3. Cari opsi **"Allow manual linking"** di halaman Authentication settings dan aktifkan. Tanpa
   ini, orang yang udah di-invite lewat password terus coba sign-in pakai Google dengan email yang
   sama bakal dianggap akun beda dan ditolak login.

## 6. Bikin akun OWNER pertama

Karena signup publik dimatikan, user pertama harus dibuat manual:

1. Supabase (prod) → **Authentication → Users → Invite user** → masukin email calon Owner
2. Buka email invite, klik link, isi nama + password (form muncul di `/invite/accept`)
3. Row `User` otomatis kebuat, tapi role default-nya `MARKETING`. Naikin ke OWNER lewat
   **Supabase → SQL Editor**:
   ```sql
   UPDATE "User" SET role = 'OWNER' WHERE email = 'email-yang-diinvite@domain.com';
   ```
4. Login ulang — sekarang punya akses OWNER penuh, dan bisa invite user lain langsung dari
   **Settings → Users** di dalam app (nggak perlu SQL manual lagi buat user berikutnya).

## 7. Deploy perubahan berikutnya

Alur normal setelah setup awal ini kelar:

- Push ke branch `main` → Vercel otomatis build & deploy.
- Kalau ada migration baru (`prisma/migrations/` bertambah), workflow `migrate-prod` otomatis
  jalanin migrasinya ke database prod.
- CI (`ci.yml`) jalan di tiap PR/push: lint, typecheck, build — pastiin ini hijau sebelum anggap
  deploy aman.

## Go-live checklist

Sebelum benar-benar dipakai tim buat kerja sehari-hari:

- [ ] Signup publik dimatikan di Supabase prod
- [ ] Bucket `assets` private, migrasi udah jalan ke prod, **seed script TIDAK dijalanin di prod**
      (`prisma/seed.ts` cuma buat data dummy development)
- [ ] Akun OWNER pertama udah dibuat dan bisa login
- [ ] Custom domain aktif dengan HTTPS (kalau pakai)
- [ ] Percobaan end-to-end: invite user baru → terima email → accept → login → buka dashboard,
      semua jalan tanpa error
- [ ] Backup pertama udah dicoba sekali (lihat [Backup & Disaster Recovery](./04-backup-disaster-recovery.md))
