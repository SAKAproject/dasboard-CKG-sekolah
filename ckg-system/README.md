# Sistem Informasi CKG (Cek Kesehatan Gratis)

Sistem multi-tenant untuk Program CKG anak sekolah SD/MI — dipakai Puskesmas, Sekolah, dan Wali Murid.

Dibangun dengan **Next.js 15 + React 19 + TypeScript (strict) + Prisma + Supabase (PostgreSQL, Auth, Storage)**.

Dokumen desain lengkap (analisis kebutuhan, ERD, SQL, panduan ekstensi) ada di `SISTEM_CKG_DESAIN_LENGKAP.md` pada proyek ini.

---

## 1. Status Proyek

Source code di repo ini sudah:
- ✅ Type-check TypeScript **bersih tanpa error** (`npx tsc --noEmit`)
- ✅ Next.js build **berhasil compile** seluruh kode aplikasi (webpack, JSX, route)
- ⏳ **Belum** bisa generate Prisma Client secara otomatis di lingkungan pembuatan kode ini karena domain `binaries.prisma.sh` tidak dapat diakses dari sandbox tersebut. **Anda wajib menjalankan `npx prisma generate` di komputer/CI Anda sendiri** sebelum `npm run dev` atau `npm run build` — lihat Langkah 4 di bawah.

Tidak ada logika aplikasi yang hilang akibat ini; ini murni keterbatasan jaringan saat pembuatan kode, bukan bug.

---

## 2. Struktur Folder

```
ckg-system/
├── app/
│   ├── (auth)/login/          # Halaman login
│   ├── (dashboard)/           # Dashboard admin, guru, petugas (perlu login)
│   │   ├── admin/
│   │   ├── guru/
│   │   └── petugas/
│   └── form/ckg/              # Form CKG publik (siswa/ortu, tanpa login)
├── components/
│   ├── dashboard/             # StatsCard, ClassTable, EntryStatusBadge, dll
│   ├── forms/                 # Engine form dinamis (DynamicQuestion, FormCKGClient)
│   └── layout/                # Sidebar dinamis dari database
├── actions/                   # Server Actions (form-submission, entry-status, reports, dll)
├── lib/                       # Prisma client, Supabase client, auth helper, utils
├── prisma/
│   ├── schema.prisma          # 22 model database
│   └── seed.ts                # Seed tenant, role, menu, 97 pertanyaan skrining CKG
└── types/                     # Tipe TypeScript bersama
```

---

## 3. Hak Akses (Role)

| Role | Kode | Akses |
|---|---|---|
| Administrasi | `admin` | Akses penuh: kelola user, master data, laporan, pengaturan sistem |
| Petugas Entri | `petugas_entri` | Lihat hasil CKG + tandai status sudah/belum diinput ke sistem |
| Guru | `guru` | Dashboard total siswa & rincian per kelas, dibatasi sekolah sendiri |
| Siswa/Orang Tua | `siswa` | Hanya isi form CKG via link publik, terima notifikasi sukses saja |

Logic akses ditegakkan di `lib/auth.ts` (`requireRole`) pada setiap Server Action, dan dirancang untuk dikuatkan lagi dengan Supabase Row Level Security (lihat `SISTEM_CKG_DESAIN_LENGKAP.md` Bagian 4).

---

## 4. Setup Lokal

### Prasyarat
- Node.js 20+
- Akun [Supabase](https://supabase.com) (gratis untuk mulai)
- Akses internet penuh (tanpa pembatasan domain) — **wajib** untuk langkah 4.3

### 4.1 Install dependencies
```bash
npm install
```

### 4.2 Setup environment
```bash
cp .env.example .env.local
# Isi DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL,
# NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# (didapat dari Supabase Dashboard → Project Settings → API & Database)
```

### 4.3 Generate Prisma Client (WAJIB, jalankan di lingkungan Anda sendiri)
```bash
npx prisma generate
```
Perintah ini mengunduh query engine dari `binaries.prisma.sh`. Jika Anda menjalankan di lingkungan dengan firewall/proxy ketat (mis. CI terisolasi), pastikan domain tersebut diizinkan, atau gunakan [Prisma Accelerate / Data Proxy](https://www.prisma.io/docs/accelerate) sebagai alternatif yang tidak butuh native engine.

### 4.4 Migrasi database
```bash
npx prisma migrate dev --name init
```

### 4.5 Seed data awal
Seed membuat 1 tenant demo, 4 role, menu sidebar, dan **97 pertanyaan skrining CKG** sesuai `form_ckg_2025.pdf`:
```bash
npm run db:seed
```

### 4.6 Buat user admin pertama
Seed tidak membuat akun login (karena perlu Supabase Auth). Buat manual:
1. Buka **Supabase Dashboard → Authentication → Users → Add User**, isi email & password.
2. Salin `User UID` yang dihasilkan.
3. Jalankan SQL berikut di **Supabase SQL Editor** (ganti `<UID>` dan `<TENANT_ID>`):
```sql
INSERT INTO users (id, tenant_id, role_id, supabase_uid, nama_lengkap, email, status_aktif)
SELECT
  gen_random_uuid(),
  t.id,
  r.id,
  '<UID>',
  'Admin Puskesmas',
  'admin@pkm.go.id',
  true
FROM tenants t
JOIN roles r ON r.tenant_id = t.id AND r.kode_role = 'admin'
WHERE t.kode_tenant = 'PKM001';
```

### 4.7 Jalankan aplikasi
```bash
npm run dev
```
- Dashboard: [http://localhost:3000/login](http://localhost:3000/login)
- Form CKG publik: [http://localhost:3000/form/ckg?tenant=PKM001](http://localhost:3000/form/ckg?tenant=PKM001)

---

## 5. Cara Menambah Hal Baru Tanpa Coding

Halaman admin berikut **sudah dibangun lengkap** dengan UI (bukan hanya Server Action):

| Halaman | Route | Fungsi |
|---|---|---|
| Master Data | `/dashboard/admin/master-data` | Kelola Sekolah, Kelas, Kecamatan, Desa (tab Sekolah & Kelas / Wilayah) |
| Import Data Massal | `/dashboard/admin/import` | Download template Excel → upload → pratinjau valid/error → konfirmasi simpan |
| Laporan & Rekap | `/dashboard/admin/reports` | Export rekap (sekolah, kelas, desa, gol. darah, gender, status isi) ke Excel & PDF |
| Form Builder | `/dashboard/admin/form-builder` | Tambah/urutkan/nonaktifkan kategori & pertanyaan skrining, atur filter kelas/gender per pertanyaan |
| Custom Field Builder | `/dashboard/admin/custom-field` | Tambah field baru ke modul Siswa/Orang Tua/Kesehatan |
| Pengaturan Branding | `/dashboard/admin/settings` | Ubah nama aplikasi, logo, warna tema, dengan pratinjau langsung |
| Pusat Pembaruan DB | `/dashboard/admin/database` | Statistik sistem, riwayat audit log, panduan backup/migrate |
| Manajemen User | `/dashboard/admin/users` | Lihat & aktifkan/nonaktifkan user |

Semua perubahan dari halaman ini langsung tersimpan ke database — tanpa perlu redeploy aplikasi. Detail desain ada di Bagian 9–15 `SISTEM_CKG_DESAIN_LENGKAP.md`.

### Alur Import Data Massal
1. Admin/Petugas Entri download template (otomatis berisi sheet Petunjuk, Data Siswa, Referensi Sekolah, Referensi Kelas sesuai data terkini)
2. Isi template, upload kembali
3. Sistem validasi tiap baris (NIK 16 digit + unik, NISN 10 digit, sekolah/kelas harus cocok referensi, format tanggal/HP)
4. Pratinjau menampilkan jumlah data valid vs error, dengan detail pesan error per baris
5. Data error bisa diunduh sebagai file Excel terpisah untuk diperbaiki
6. Hanya data valid yang dikonfirmasi untuk disimpan ke database

### Export Laporan
Tombol "Export Excel" dan "Export PDF" di halaman Laporan & Rekap menghasilkan file berisi 5-6 tabel rekap (per sekolah, kelas, desa, golongan darah, jenis kelamin, status pengisian), masing-masing dengan total dan persentase — siap dilaporkan ke Dinas Kesehatan.

**Belum dibangun**: Riwayat lengkap migration_logs di UI (saat ini Pusat Pembaruan DB hanya baca dari `_prisma_migrations` Prisma), antarmuka subscription/billing SaaS.

---

## 6. Skrip NPM

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan server development |
| `npm run build` | Build production |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Buat & jalankan migration baru (dev) |
| `npm run db:deploy` | Terapkan migration ke production |
| `npm run db:studio` | Buka Prisma Studio (GUI database) |
| `npm run db:seed` | Jalankan seed data awal |

---

## 7. Deploy

### GitHub
```bash
git init && git add . && git commit -m "Initial commit: Sistem CKG"
git remote add origin https://github.com/ORG/ckg-system.git
git push -u origin main
```

### Vercel
1. Import repo di [vercel.com/new](https://vercel.com/new)
2. Set semua environment variable dari `.env.example`
3. Deploy — `npx prisma generate` otomatis berjalan di build Vercel (jaringan Vercel tidak punya batasan seperti sandbox pembuatan kode ini)

---

## 8. Keamanan

- Semua dependency menggunakan versi terbaru yang sudah dipatch (Next.js 15.5.18, React 19.2.6) per Juni 2026 — tidak ada kerentanan high/critical pada paket inti.
- `xlsx` diganti dengan `exceljs` karena `xlsx` punya CVE prototype pollution tanpa fix resmi.
- Row Level Security (RLS) di Supabase **wajib diaktifkan** sesuai SQL pada `SISTEM_CKG_DESAIN_LENGKAP.md` Bagian 4 sebelum go-live, sebagai lapisan pertahanan kedua di luar pengecekan role pada Server Actions.
