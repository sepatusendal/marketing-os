# MarketingOS — Dokumentasi Operasional

Dokumentasi ini buat operasional sehari-hari (bukan spesifikasi produk — itu ada di
[`docs/marketingos-prd.md`](../marketingos-prd.md)). Ditulis buat siapa pun yang pegang akses
Vercel/Supabase/GitHub project ini, termasuk yang nggak coding sehari-hari.

## Isi

1. **[Deployment Guide](./01-deployment-guide.md)** — cara setup dari nol (Supabase, Vercel,
   GitHub, domain, Google OAuth) dan cara deploy perubahan baru.
2. **[Manual Config Guide](./02-manual-config-guide.md)** — cara edit hal-hal yang sering
   berubah: user & role, environment variables, domain, notifikasi email, kolom task board.
3. **[Troubleshooting](./03-troubleshooting.md)** — daftar error yang pernah muncul, penyebabnya,
   dan cara benerinnya. Cek di sini dulu sebelum panik.
4. **[Backup & Disaster Recovery](./04-backup-disaster-recovery.md)** — cara backup data, dan apa
   yang harus dilakuin kalau server/database/deployment bermasalah.

## Prinsip penting

- **Jangan pernah taruh password/API key asli di file dokumentasi atau commit ke Git.** Semua
  contoh di dokumen ini pakai placeholder (`<seperti-ini>`). Kredensial asli cuma boleh ada di:
  Vercel Environment Variables, GitHub Secrets, Supabase dashboard, dan password manager pribadi.
- **Dua environment terpisah:** `marketingos-dev` (buat testing/preview) dan `marketingos-prod`
  (data asli, dipakai tim). Jangan pernah tes fitur baru langsung di prod.
- Kalau ragu sebelum ngubah sesuatu yang bisa berdampak ke semua orang (migrasi database, ganti
  domain, ganti provider auth), lebih baik tanya dulu daripada nekat.
