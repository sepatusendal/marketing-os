# Troubleshooting

Daftar error yang beneran pernah muncul pas setup/pakai project ini, penyebabnya, dan cara
benerinnya. Cek daftar ini dulu sebelum minta bantuan — kemungkinan besar udah pernah kejadian.

**Cara liat error asli di production:** Next.js sengaja nyembunyiin detail error di browser
production (cuma nampilin "Something went wrong"). Error aslinya ada di **Vercel → project →
tab Logs** (atau **Runtime Logs** di halaman deployment). Buka log, ulangi aksi yang error di
browser, cari baris log yang muncul barengan.

---

### "Can't reach database server at `....pooler.supabase.com:6543`"

**Penyebab:** Biasanya salah satu dari:
- Koneksi internet/jaringan lagi bermasalah sesaat (coba reload)
- Project Supabase-nya **paused** (Supabase free tier otomatis pause project yang nggak ada
  aktivitas ~1 minggu)

**Fix:**
1. Cek Supabase dashboard project terkait — kalau ada banner "Project is paused", klik
   **Restore**, tunggu beberapa menit
2. Kalau nggak paused, coba lagi beberapa saat — biasanya transient

### `Error: P1000: Authentication failed against database server`

**Penyebab:** Password di `DATABASE_URL`/`DIRECT_URL` salah — biasanya karena password di-reset
tapi cuma diupdate di satu tempat (misal cuma di Vercel, lupa update GitHub secret, atau
sebaliknya).

**Fix:** Update password yang bener di **semua** tempat yang pakai (Vercel `DATABASE_URL`, dan
kalau itu project prod, GitHub secret `PROD_DIRECT_URL` juga). Lihat
["Ubah password database"](./02-manual-config-guide.md#ubah-password-database-supabase).

### `Error: P1012` / `Environment variable not found: DIRECT_URL`

**Penyebab:** Ada proses yang jalanin `prisma migrate` tapi env var `DIRECT_URL` nggak ke-set di
proses itu. Schema Prisma butuh dua-duanya (`DATABASE_URL` dan `DIRECT_URL`) buat bisa divalidasi,
walaupun migrate cuma benar-benar pakai yang `DIRECT_URL`.

**Fix:** Pastiin env yang jalanin migrate nyetel dua-duanya. Kalau ini di GitHub Actions workflow
(`migrate-prod.yml`), cek section `env:` di step `npx prisma migrate deploy` — harus ada
`DATABASE_URL` dan `DIRECT_URL`, dua-duanya boleh nunjuk ke value yang sama (direct connection).

### `Error: P2024: Timed out fetching a new connection from the connection pool`

**Penyebab:** `connection_limit` di `DATABASE_URL` ke-set kekecilan (misal `1`) buat halaman yang
nembak banyak query database sekaligus (kayak Dashboard).

**Fix:** Naikin `connection_limit` di `DATABASE_URL` (Vercel env var, scope Production/Preview
yang kena) jadi `5`, lalu Redeploy. Jangan naikin terlalu tinggi (misal puluhan) — Supabase
pooler punya batas total koneksi yang dishare semua koneksi.

### `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`

**Penyebab:** Coba sign-in Google tapi provider Google belum di-enable di Supabase Auth.

**Fix:** Supabase (project yang relevan) → **Authentication → Sign In / Providers → Google** →
Enable, isi Client ID & Client Secret dari Google Cloud Console. Detail lengkap di
[Deployment Guide §5](./01-deployment-guide.md#5-setup-google-sign-in-opsional).

### Google Cloud Console: "Invalid Origin: URIs must not contain a path or end with `/`"

**Penyebab:** Salah masukin URL callback (yang ada path-nya, misal `/auth/v1/callback`) ke field
**"Authorized JavaScript origins"** — field itu cuma nerima domain polos tanpa path. URL yang ada
path-nya harus masuk ke field **"Authorized redirect URIs"** (biasanya di bawahnya).

**Fix:** Kosongin/hapus dari "Authorized JavaScript origins", pindahin ke "Authorized redirect
URIs".

### Setelah klik "Get started" di halaman invite/accept, nggak redirect ke mana-mana

**Penyebab (sudah diperbaiki di kode, per commit `b147d01` dan `71d06ea`/sekitarnya):** Ada dua
sumber invite — lewat Supabase dashboard langsung (nunjuk ke root `/` dulu) dan lewat app
(`Settings → Users → Invite`). Awalnya cuma jalur pertama yang bener-bener nyimpen sesi user baru
sebelum landing di form. Ini udah diperbaiki: dua-duanya sekarang lewat root dulu, dan form-nya
sendiri udah dibikin lebih toleran (auto-bikin row user kalau belum ada).

**Kalau masih kejadian juga:** screenshot Console browser (klik kanan → Inspect → tab Console)
pas nge-klik tombolnya, cari pesan error merah, itu petunjuk paling akurat.

### Setelah sign-in Google, malah kepental ke `/login?code=...` (nggak masuk dashboard)

**Penyebab (sudah diperbaiki, commit `a021ce0`):** Middleware auth-gate app ini awalnya nganggep
route `/api/auth/callback` (yang justru tugasnya nyelesaiin proses login) sebagai "halaman yang
butuh login" — jadi keintersep dan di-redirect balik ke `/login` sebelum sempet nyelesain proses
tukar kode jadi sesi.

**Kalau masih kejadian:** kemungkinan **Site URL** atau **Redirect URLs** di Supabase Authentication
→ URL Configuration salah/ketinggalan update (misal abis ganti domain custom tapi lupa update
config Supabase-nya). Cek [Deployment Guide §4](./01-deployment-guide.md#4-setup-domain-custom-opsional) —
Site URL harus persis domain root (tanpa path kayak `/login`), dan Redirect URLs harus ada baris
persis `https://domain-lo/api/auth/callback`.

### Dashboard muncul "Something went wrong" abis login

**Penyebab paling umum:** query database timeout (lihat P2024 di atas) atau environment variable
salah/ketinggalan di scope yang lagi diakses.

**Fix:** Cek Vercel Runtime Logs (lihat cara di atas), cari error message dan `code:` di situ,
cocokin sama daftar di halaman ini.

### CSV export kebuka aneh / ada formula di Excel

**Penyebab (sudah diperbaiki, commit `7820f89`):** Ini celah keamanan (CSV/formula injection) —
kalau ada campaign/lead yang namanya diawali karakter `=`, `+`, `-`, atau `@`, Excel/Sheets bisa
salah baca itu sebagai formula pas file CSV dibuka. Udah diperbaiki di kode (karakter itu
di-escape otomatis pas export).

### Migration GitHub Action gagal terus padahal secret udah bener

**Cek:**
1. Buka **Actions** tab di GitHub → klik run yang gagal → klik step yang merah → baca log
   detailnya (biasanya jelas: connection error, syntax error di migration file, dsb)
2. Pastiin secret `PROD_DIRECT_URL` nggak ada tanda kutip atau spasi nyelip pas di-paste
3. Kalau workflow-nya nggak muncul tombol "Run workflow" di tab Actions, pastiin
   `.github/workflows/migrate-prod.yml` punya trigger `workflow_dispatch:` (harusnya udah ada
   dari commit `b55c511`)

### Project Supabase prod ke-pause padahal udah ada cron job "keep-alive"

**Cek:**
1. Vercel project → **Settings → Cron Jobs** — pastiin ada satu entry `/api/cron/keep-alive`
   berstatus aktif
2. Vercel project → tab **Logs**, cari request ke `/api/cron/keep-alive` — kalau responnya
   `401 Unauthorized`, artinya env var `CRON_SECRET` belum diset (atau salah) di scope
   **Production**. Set/perbaiki di Environment Variables, lalu Redeploy.
3. Kalau plan Vercel-nya bukan yang support cron (cron job butuh minimal plan tertentu), cron
   nggak akan jalan sama sekali — cek dokumentasi Vercel soal cron buat plan yang lagi dipakai.
4. Kalau semua di atas normal tapi tetap ke-pause, restore manual aja (lihat
   [Backup & Disaster Recovery](./04-backup-disaster-recovery.md)) — cron ini best-effort, bukan
   garansi mutlak.

### `npm run backup` gagal dengan "Authentication failed"

**Penyebab:** Connection string yang dipakai (dari `.env` lokal atau `BACKUP_DATABASE_URL`) punya
password yang salah/kadaluarsa — sering kejadian kalau password project itu pernah di-reset tapi
`.env` lokal nggak ikut diupdate.

**Fix:** Ambil connection string **direct** (port 5432) yang fresh dari Supabase dashboard project
terkait (**Settings → Database → Connection string**), pakai itu di `BACKUP_DATABASE_URL` (jangan
edit `.env` kalau cuma buat backup sekali, lihat contoh di
[Backup & Disaster Recovery](./04-backup-disaster-recovery.md)).

### Nggak tau harus mulai dari mana buat error yang nggak ada di daftar ini

1. Screenshot error-nya lengkap (termasuk URL di address bar)
2. Cek Vercel Runtime Logs / GitHub Actions logs buat pesan error yang lebih detail
3. Kalau errornya dari halaman tertentu, coba reproduce sekali lagi sambil buka DevTools Console
   (klik kanan → Inspect → Console) buat nangkep error di sisi browser
