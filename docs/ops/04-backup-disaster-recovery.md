# Backup & Disaster Recovery

## Cara backup data

**Settings → Workspace** (perlu role OWNER/ADMIN) → tombol **"Export full backup (JSON)"**.

Ini nge-download satu file `.json` yang isinya semua data: users, campaigns, tasks, leads,
clients, expenses, assets (metadata-nya, bukan file-nya), knowledge articles, comments, activity
log, notifications.

**Penting soal file ini:**
- **Ini snapshot, bukan mekanisme restore otomatis.** Kalau ada masalah data, file ini bisa dibuka
  dan dibaca manual buat liat data lama, tapi nggak ada tombol "import balik" di app. Kalau
  beneran perlu restore dari file ini, itu kerjaan manual (tulis script insert ke database, atau
  minta bantuan developer) — bukan sekali klik.
- **Nggak ada password/secret di dalamnya.** File ini nggak nyimpen password login user (itu
  disimpen terpisah di sistem Auth Supabase, bukan di database aplikasi) dan nggak nyimpen
  `service_role` key atau credential lain.
- **Nggak ada file asset asli** (gambar/dokumen yang diupload) — cuma metadata-nya (nama file,
  ukuran, siapa yang upload). File aslinya ada di Supabase Storage, terpisah dari export ini.
- **Belum ada jadwal otomatis.** Belum ada cron job yang bikin backup otomatis — ini harus di-klik
  manual. **Rekomendasi: download backup ini minimal sebulan sekali**, simpan di tempat aman
  (Google Drive/folder terenkripsi), kasih nama file yang ada tanggalnya (misal
  `marketingos-backup-2026-07-21.json`).

## Kalau Vercel deployment rusak (abis push kode baru, app jadi error semua)

1. Vercel project → tab **Deployments**
2. Cari deployment SEBELUMNYA yang masih normal (biasanya ada tanda "Ready" ijo)
3. Klik titik tiga di deployment itu → **Promote to Production**

Ini langsung balikin production ke versi kode sebelumnya tanpa perlu revert Git dulu. Setelah itu
baru benerin kodenya dengan tenang, test, baru deploy ulang.

## Kalau database Supabase kena masalah / data ilang

Supabase (paid plan) punya fitur **Point-in-Time Recovery (PITR)** dan backup harian otomatis dari
sisi mereka — ini di luar backup manual yang kita jelasin di atas, dan biasanya jauh lebih
reliable buat restore beneran. Cek di Supabase dashboard project terkait → **Database → Backups**
buat liat opsi yang tersedia sesuai plan yang dipakai.

Kalau nggak ada PITR (misal masih di free tier) dan data beneran ilang: satu-satunya jalan balik
adalah file backup JSON manual yang paling baru (lihat section di atas) — dan itu pun butuh
proses restore manual, bukan otomatis.

**Rekomendasi:** kalau data di app ini udah dianggap kritikal buat operasional, pertimbangkan
upgrade plan Supabase yang ada PITR-nya.

## Kalau project Supabase ke-pause (nggak ada aktivitas lama)

Supabase free tier otomatis pause project yang nggak ada aktivitas API sekitar 1 minggu. App bakal
mulai error "Can't reach database server" (lihat [Troubleshooting](./03-troubleshooting.md)).

**Fix:** buka Supabase dashboard project itu, klik **Restore**, tunggu beberapa menit sampai
statusnya balik jadi Active. Nggak ada data yang hilang dari proses ini, cuma butuh di-"nyalain"
lagi manual.

## Kalau semua akun OWNER/ADMIN ke-lock (nggak ada yang bisa login/kelola user)

1. Buka Supabase dashboard (prod) → **SQL Editor**
2. Cari user yang mau dijadiin OWNER lagi (lo harus tau email-nya, dan user itu harus udah pernah
   login minimal sekali biar row `User`-nya ada di database):
   ```sql
   SELECT id, email, role, "isActive" FROM "User" WHERE email = 'email-nya@domain.com';
   ```
3. Naikin role-nya jadi OWNER dan aktifkan kalau perlu:
   ```sql
   UPDATE "User" SET role = 'OWNER', "isActive" = true WHERE email = 'email-nya@domain.com';
   ```

Ini akses "master key" yang selalu ada karena Prisma connect ke database pakai koneksi langsung
(bukan lewat aplikasi), jadi nggak pernah beneran "terkunci total" selama masih ada akses ke
Supabase dashboard.

## Kalau domain custom bermasalah (DNS, sertifikat SSL)

1. Vercel project → **Settings → Domains** → cek status domain, biasanya ada pesan error spesifik
   (misal "Invalid Configuration" kalau DNS record salah)
2. Cek ulang DNS record di provider domain lo sesuai instruksi yang Vercel kasih
3. Sebagai fallback sementara, domain bawaan `*.vercel.app` selalu tetap aktif dan bisa dipakai
   buat akses app selama domain custom lagi bermasalah — asal `APP_BASE_URL` dan Supabase Redirect
   URLs juga di-set balik sementara kalau perlu (lihat
   [Deployment Guide §4](./01-deployment-guide.md#4-setup-domain-custom-opsional))

## Ringkasan: siapa punya akses "darurat"

| Skenario | Butuh akses ke |
|---|---|
| Rollback kode | Vercel dashboard |
| Restore/lihat data lama | File backup JSON (lokal, di tempat penyimpanan lo) |
| Recovery via PITR | Supabase dashboard (kalau plan-nya support) |
| Bikin ulang akses OWNER | Supabase SQL Editor |
| Domain/DNS | Vercel dashboard + DNS provider domain |

Pastiin minimal ada 2 orang (nggak cuma 1) yang punya akses ke Vercel dan Supabase dashboard buat
project ini, biar nggak ada single point of failure kalau satu orang nggak bisa dihubungi pas
darurat.
