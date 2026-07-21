# Manual Config Guide

Cara ngerjain hal-hal yang sering perlu diubah, tanpa perlu nyentuh kode. Kalau butuh ubah
sesuatu yang beneran butuh perubahan kode (misal ubah izin role), tetep kasih tau bagian "butuh
kode" di tiap section.

---

## Undang user baru

**Cara normal (lewat app, kalau lo udah punya akun OWNER/ADMIN):**

1. Login ke app → **Settings → Users**
2. Isi email di form invite → **Invite**
3. Orang itu terima email, klik link, isi nama + password → otomatis punya akun dengan role
   default `MARKETING`
4. Kalau perlu role lain, ubah di step berikutnya (lihat "Ubah role user")

**Kalau nggak ada akun OWNER/ADMIN sama sekali** (misal abis reset environment): invite manual
lewat Supabase dashboard, lihat langkah "Bikin akun OWNER pertama" di
[Deployment Guide](./01-deployment-guide.md#6-bikin-akun-owner-pertama).

## Ubah role user

1. **Settings → Users** → cari user-nya di tabel → klik dropdown role di baris itu → pilih role
   baru
2. Cuma **OWNER** yang bisa naikin/ubah siapa pun ke/dari role **OWNER**. ADMIN bisa ubah role
   user lain (MANAGER ke bawah), tapi nggak bisa naikin diri sendiri atau orang lain jadi OWNER,
   dan nggak bisa nonaktifin akun OWNER — itu emang sengaja dibatasi biar nggak ada yang bisa
   ambil alih akses penuh tanpa sepengetahuan Owner asli.
3. Buat liat persis apa aja yang boleh dilakuin tiap role, scroll ke bawah di halaman
   **Settings → Users** — ada card referensi **"Roles & Permissions"**.

**Butuh kode kalau:** mau ubah APA YANG BOLEH dilakuin suatu role (misal "MARKETING boleh hapus
campaign juga") — itu diatur di `src/lib/rbac.ts`, bukan lewat UI. Minta tolong siapa pun yang
pegang kode (atau Claude Code) buat ubah baris di `MATRIX` pada file itu.

## Nonaktifkan / aktifkan kembali user

**Settings → Users** → toggle status di baris user tersebut. Data historis user itu (campaign,
task, dll yang pernah dia buat) tetap ada, cuma dia nggak bisa login lagi selama nonaktif.

## Tambah/ubah kolom Task Board

**Settings → Board** (perlu role Manager ke atas):

- **Add column**: kasih nama, warna, dan status yang di-mapping (`TODO`/`IN_PROGRESS`/dst — ini
  yang nentuin task di kolom itu dihitung sebagai apa di dashboard/report)
- **WIP limit**: cuma peringatan visual, nggak pernah nge-block orang drag task ke kolom yang
  udah penuh
- **Reorder**: drag kolom buat ubah urutan
- **Delete**: task yang ada di kolom itu otomatis dipindah ke "tanpa kolom" (columnId kosong) —
  tapi **hati-hati**, kalau nggak ada kolom lain yang di-mapping ke status yang sama, task baru
  yang dibuat sistem otomatis (misal onboarding task dari lead WON) bisa nggak muncul di board
  manapun kalau nggak ada kolom `TODO` sama sekali. Selalu sisain minimal satu kolom yang
  mapping ke `TODO`.

Kolom ini **shared buat semua campaign** — bukan per-campaign. Ubah di sini ngaruh ke tampilan
board di semua tempat (halaman Tasks global + tab Tasks tiap campaign).

## Ubah Environment Variables di Vercel

1. Vercel project → **Settings → Environment Variables**
2. Cari key yang mau diubah, perhatikan **scope**-nya (Production/Preview/Development) — pastiin
   edit yang scope-nya bener, jangan sampai edit yang salah environment
3. Edit value → Save
4. **Wajib Redeploy** setelah edit env var — perubahan nggak otomatis kepake ke deployment yang
   udah jalan. Deployments tab → titik tiga di deployment teratas → **Redeploy**

## Ubah password database (Supabase)

Kalau lo reset password database di Supabase (**Settings → Database → Reset Database Password**),
**wajib update di 2 tempat lain** juga, atau app + migrasi bakal langsung gagal connect:

1. Vercel → `DATABASE_URL` (scope yang sesuai project itu, prod atau dev)
2. Kalau yang direset itu project **prod** → GitHub repo secret `PROD_DIRECT_URL`

## Setup email notifikasi (Resend)

Defaultnya notifikasi cuma muncul di dalam app (in-app). Buat aktifin email juga:

1. Daftar/login ke [resend.com](https://resend.com), verifikasi domain pengirim
2. Buat API key baru di Resend
3. Vercel → Environment Variables → isi `RESEND_API_KEY` (API key dari Resend) dan `EMAIL_FROM`
   (alamat pengirim, misal `notifications@domainlo.com`, harus dari domain yang udah diverifikasi)
4. Redeploy

Kalau kedua variable ini kosong, app tetep jalan normal — notifikasi cuma nggak dikirim email,
tetep muncul di lonceng notifikasi dalam app.

Tiap user juga bisa matiin email notifikasi buat diri sendiri di **Settings → Profile** (toggle
"Email notifications") — nggak ngaruh ke notifikasi in-app-nya, cuma email-nya doang.

## Backup & departemen

- **Full backup (JSON)**: **Settings** → tombol backup export (perlu role OWNER/ADMIN), atau
  `npm run backup` dari terminal. Detail di
  [Backup & Disaster Recovery](./04-backup-disaster-recovery.md).
- **Daftar departemen**: nggak ada halaman edit terpisah — daftar departemen itu otomatis dari
  nilai yang pernah diisi di field "Department" pada campaign/user manapun. Ketik nama departemen
  baru di field itu pas bikin/edit campaign atau invite user, otomatis masuk daftar.
