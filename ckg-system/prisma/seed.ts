/**
 * prisma/seed.ts
 * Jalankan dengan: npm run db:seed
 *
 * Seed ini membuat:
 * 1. Tenant pertama (Puskesmas Demo)
 * 2. 4 role (admin, petugas_entri, guru, siswa)
 * 3. User admin pertama
 * 4. Menu sidebar default
 * 5. Semua pertanyaan skrining CKG sesuai form_ckg_2025.pdf (17 kategori, 97 pertanyaan)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Memulai seed database Sistem CKG...\n')

  // ─── 1. TENANT ────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { kodeTenant: 'PKM001' },
    update: {},
    create: {
      kodeTenant: 'PKM001',
      namaPuskesmas: 'Puskesmas Demo',
      alamat: 'Jl. Kesehatan No. 1',
      kecamatan: 'Kecamatan Demo',
      kabupaten: 'Kabupaten Demo',
      provinsi: 'Jawa Tengah',
      statusAktif: true,
    },
  })
  console.log(`✅ Tenant: ${tenant.namaPuskesmas} (${tenant.kodeTenant})`)

  // ─── 2. ROLES ─────────────────────────────────────────────────────────────
  const rolesData = [
    { namaRole: 'Administrasi', kodeRole: 'admin', deskripsi: 'Akses penuh ke seluruh sistem' },
    { namaRole: 'Petugas Entri', kodeRole: 'petugas_entri', deskripsi: 'Lihat dan input data CKG ke sistem' },
    { namaRole: 'Guru', kodeRole: 'guru', deskripsi: 'Dashboard total siswa dan rincian kelas' },
    { namaRole: 'Siswa / Orang Tua', kodeRole: 'siswa', deskripsi: 'Isi form CKG saja' },
  ]

  const roles: Record<string, string> = {}
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { id: `${tenant.id}-${r.kodeRole}` },
      update: {},
      create: { id: `${tenant.id}-${r.kodeRole}`, tenantId: tenant.id, ...r },
    })
    roles[r.kodeRole] = role.id
  }
  console.log(`✅ ${rolesData.length} role berhasil dibuat`)

  // ─── 3. MENU SIDEBAR ──────────────────────────────────────────────────────
  const menusData = [
    { namaMenu: 'Dashboard', icon: 'home', route: '/dashboard', nomorUrut: 1, roleAccess: ['admin', 'petugas_entri', 'guru'] },
    { namaMenu: 'Data Siswa', icon: 'users', route: '/dashboard/admin/master-data', nomorUrut: 2, roleAccess: ['admin', 'guru'] },
    { namaMenu: 'Hasil Skrining CKG', icon: 'clipboard-check', route: '/dashboard/petugas/submissions', nomorUrut: 3, roleAccess: ['admin', 'petugas_entri'] },
    { namaMenu: 'Status Entri Data', icon: 'check', route: '/dashboard/petugas', nomorUrut: 4, roleAccess: ['admin', 'petugas_entri'] },
    { namaMenu: 'Master Data', icon: 'database', route: '/dashboard/admin/master-data', nomorUrut: 5, roleAccess: ['admin'] },
    { namaMenu: 'Import Data Massal', icon: 'users', route: '/dashboard/admin/import', nomorUrut: 6, roleAccess: ['admin', 'petugas_entri'] },
    { namaMenu: 'Form Builder', icon: 'forms', route: '/dashboard/admin/form-builder', nomorUrut: 7, roleAccess: ['admin'] },
    { namaMenu: 'Custom Field Builder', icon: 'list-details', route: '/dashboard/admin/custom-field', nomorUrut: 8, roleAccess: ['admin'] },
    { namaMenu: 'Laporan & Rekap', icon: 'chart-bar', route: '/dashboard/admin/reports', nomorUrut: 9, roleAccess: ['admin', 'guru'] },
    { namaMenu: 'Manajemen User', icon: 'user-cog', route: '/dashboard/admin/users', nomorUrut: 10, roleAccess: ['admin'] },
    { namaMenu: 'Pengaturan Branding', icon: 'palette', route: '/dashboard/admin/settings', nomorUrut: 11, roleAccess: ['admin'] },
    { namaMenu: 'Pusat Pembaruan DB', icon: 'server-cog', route: '/dashboard/admin/database', nomorUrut: 12, roleAccess: ['admin'] },
  ]

  await prisma.systemMenu.deleteMany({ where: { tenantId: tenant.id } })
  await prisma.systemMenu.createMany({
    data: menusData.map((m) => ({ ...m, tenantId: tenant.id, aktif: true })),
  })
  console.log(`✅ ${menusData.length} menu sidebar berhasil dibuat`)

  // ─── 4. SISTEM SETTINGS (BRANDING DEFAULT) ────────────────────────────────
  const settings = [
    { kunci: 'nama_aplikasi', nilai: 'Sistem CKG', tipe: 'text' },
    { kunci: 'nama_instansi', nilai: 'Puskesmas Demo', tipe: 'text' },
    { kunci: 'warna_utama', nilai: '#166534', tipe: 'text' },
    { kunci: 'warna_sekunder', nilai: '#dcfce7', tipe: 'text' },
  ]
  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { tenantId_kunci: { tenantId: tenant.id, kunci: s.kunci } },
      update: { nilai: s.nilai },
      create: { tenantId: tenant.id, ...s },
    })
  }
  console.log(`✅ Pengaturan branding default berhasil diset`)

  // ─── 5. KATEGORI SKRINING ─────────────────────────────────────────────────
  const kategorisData = [
    { kodeKategori: 'identitas_sekolah', namaKategori: 'Identitas Sekolah', nomorUrut: 1, targetKelas: 'all' },
    { kodeKategori: 'identitas_siswa', namaKategori: 'Identitas Siswa', nomorUrut: 2, targetKelas: 'all' },
    { kodeKategori: 'data_ortu', namaKategori: 'Data Orang Tua / Wali', nomorUrut: 3, targetKelas: 'all' },
    { kodeKategori: 'skrining_tb', namaKategori: 'Skrining Tuberkulosis (TBC)', nomorUrut: 4, targetKelas: 'all' },
    { kodeKategori: 'skrining_dm', namaKategori: 'Skrining Diabetes Mellitus (DM)', nomorUrut: 5, targetKelas: 'all' },
    { kodeKategori: 'jiwa_kelas_1_3', namaKategori: 'Skrining Kesehatan Jiwa (Kelas 1-3)', nomorUrut: 6, targetKelas: '1-3' },
    { kodeKategori: 'jiwa_kelas_4_6', namaKategori: 'Skrining Kesehatan Jiwa (Kelas 4-6)', nomorUrut: 7, targetKelas: '4-6' },
    { kodeKategori: 'repro_putri', namaKategori: 'Skrining Kesehatan Reproduksi Putri', nomorUrut: 8, targetKelas: '4-6' },
    { kodeKategori: 'repro_putra', namaKategori: 'Skrining Kesehatan Reproduksi Putra', nomorUrut: 9, targetKelas: '4-6' },
    { kodeKategori: 'merokok', namaKategori: 'Skrining Perilaku Merokok', nomorUrut: 10, targetKelas: '4-6' },
    { kodeKategori: 'imunisasi', namaKategori: 'Riwayat Imunisasi', nomorUrut: 11, targetKelas: '1' },
    { kodeKategori: 'aktivitas_fisik', namaKategori: 'Aktivitas Fisik', nomorUrut: 12, targetKelas: '4-6' },
    { kodeKategori: 'kebugaran', namaKategori: 'Skrining Kebugaran', nomorUrut: 13, targetKelas: '4-6' },
    { kodeKategori: 'hepatitis', namaKategori: 'Skrining Hepatitis', nomorUrut: 14, targetKelas: 'all' },
    { kodeKategori: 'penyakit_tropis', namaKategori: 'Penyakit Tropis Terabaikan', nomorUrut: 15, targetKelas: 'all' },
    { kodeKategori: 'malaria', namaKategori: 'Faktor Risiko Malaria', nomorUrut: 16, targetKelas: 'all' },
    { kodeKategori: 'riwayat_ortu', namaKategori: 'Riwayat Penyakit Orang Tua', nomorUrut: 17, targetKelas: 'all' },
  ]

  await prisma.screeningCategory.deleteMany({ where: { tenantId: tenant.id } })
  const kategoriMap: Record<string, string> = {}
  for (const k of kategorisData) {
    const cat = await prisma.screeningCategory.create({
      data: { tenantId: tenant.id, ...k, aktif: true },
    })
    kategoriMap[k.kodeKategori] = cat.id
  }
  console.log(`✅ ${kategorisData.length} kategori skrining berhasil dibuat`)

  // ─── 6. PERTANYAAN SKRINING (berdasarkan form_ckg_2025.pdf) ──────────────
  const yn = JSON.stringify(['Ya', 'Tidak'])

  const pertanyaanData: {
    kode: string; no: number; teks: string; tipe: string;
    opsi?: string; kondisi?: object; skip?: object
  }[] = [
    // SKRINING TBC (Q32-36)
    { kode: 'skrining_tb', no: 32, teks: 'Apakah saat ini anak anda sedang batuk-batuk lebih dari 2 minggu?', tipe: 'ya_tidak', opsi: yn },
    { kode: 'skrining_tb', no: 33, teks: 'Apakah anak Anda mengalami BB turun tanpa penyebab jelas / BB tidak naik dalam 2 bulan / nafsu makan turun?', tipe: 'ya_tidak', opsi: yn },
    { kode: 'skrining_tb', no: 34, teks: 'Apakah anak Anda mengalami demam hilang timbul tanpa sebab yang jelas lebih dari 2 minggu?', tipe: 'ya_tidak', opsi: yn },
    { kode: 'skrining_tb', no: 35, teks: 'Apakah anak Anda mengalami lesu atau malaise, anak kurang aktif bermain?', tipe: 'ya_tidak', opsi: yn },
    { kode: 'skrining_tb', no: 36, teks: 'Apakah Anda ada kontak dengan pasien Tuberkulosis (TBC)?', tipe: 'ya_tidak', opsi: yn },

    // SKRINING DIABETES MELLITUS (Q37-42)
    { kode: 'skrining_dm', no: 37, teks: 'Apakah anak anda sering Buang Air Kecil (BAK) di malam hari (> 3 kali)?', tipe: 'ya_tidak', opsi: yn },
    { kode: 'skrining_dm', no: 38, teks: 'Apakah anak anda sering merasa haus berlebihan (> 8 gelas/hari)?', tipe: 'ya_tidak', opsi: yn },
    { kode: 'skrining_dm', no: 39, teks: 'Apakah anak anda sering merasa lapar berlebihan walaupun sudah makan?', tipe: 'ya_tidak', opsi: yn },
    { kode: 'skrining_dm', no: 40, teks: 'Apakah anak anda mengalami penurunan berat badan tanpa sebab yang jelas?', tipe: 'ya_tidak', opsi: yn },
    { kode: 'skrining_dm', no: 41, teks: 'Apakah anak anda masih sering mengompol (usia > 5 tahun)?', tipe: 'ya_tidak', opsi: yn },
    { kode: 'skrining_dm', no: 42, teks: 'Apakah ada anggota keluarga yang menderita Diabetes Mellitus?', tipe: 'ya_tidak', opsi: yn },

    // KESEHATAN JIWA KELAS 1-3: ANSIETAS
    { kode: 'jiwa_kelas_1_3', no: 43, teks: 'Apakah anak anda sering merasa takut atau khawatir berlebihan yang mengganggu kegiatan sehari-hari?', tipe: 'ya_tidak', opsi: yn, kondisi: { kelas: ['1','2','3'] } },
    { kode: 'jiwa_kelas_1_3', no: 44, teks: 'Apakah anak anda sering mengeluh sakit perut, sakit kepala, atau gejala fisik lain tanpa penyebab medis yang jelas saat menghadapi situasi tertentu?', tipe: 'ya_tidak', opsi: yn, kondisi: { kelas: ['1','2','3'] } },
    { kode: 'jiwa_kelas_1_3', no: 45, teks: 'Apakah anak anda menghindari situasi tertentu (misal: sekolah, keramaian) karena rasa takut atau cemas?', tipe: 'ya_tidak', opsi: yn, kondisi: { kelas: ['1','2','3'] } },
    // DEPRESI KELAS 1-3
    { kode: 'jiwa_kelas_1_3', no: 46, teks: 'Apakah anak anda sering tampak sedih, murung, atau mudah menangis tanpa alasan jelas?', tipe: 'ya_tidak', opsi: yn, kondisi: { kelas: ['1','2','3'] } },
    { kode: 'jiwa_kelas_1_3', no: 47, teks: 'Apakah anak anda kehilangan minat pada aktivitas yang sebelumnya disukai (bermain, belajar)?', tipe: 'ya_tidak', opsi: yn, kondisi: { kelas: ['1','2','3'] } },
    { kode: 'jiwa_kelas_1_3', no: 48, teks: 'Apakah anak anda menunjukkan perubahan perilaku seperti sering menyendiri, sulit tidur, atau perubahan nafsu makan?', tipe: 'ya_tidak', opsi: yn, kondisi: { kelas: ['1','2','3'] } },

    // KESEHATAN JIWA KELAS 4-6: ANSIETAS
    { kode: 'jiwa_kelas_4_6', no: 49, teks: 'Apakah kamu sering merasa gelisah, khawatir atau tegang yang sulit kamu kendalikan?', tipe: 'ya_tidak', opsi: yn, kondisi: { kelas: ['4','5','6'] } },
    { kode: 'jiwa_kelas_4_6', no: 50, teks: 'Apakah kamu sering mengalami gejala fisik seperti jantung berdebar, berkeringat berlebihan, atau gemetar tanpa penyebab yang jelas?', tipe: 'ya_tidak', opsi: yn, kondisi: { kelas: ['4','5','6'] } },
    { kode: 'jiwa_kelas_4_6', no: 51, teks: 'Apakah rasa cemas atau ketakutanmu mengganggu aktivitas sehari-hari seperti belajar atau bergaul?', tipe: 'ya_tidak', opsi: yn, kondisi: { kelas: ['4','5','6'] } },
    // DEPRESI KELAS 4-6
    { kode: 'jiwa_kelas_4_6', no: 52, teks: 'Apakah kamu sering merasa sedih, hampa, atau putus asa hampir setiap hari?', tipe: 'ya_tidak', opsi: yn, kondisi: { kelas: ['4','5','6'] } },
    { kode: 'jiwa_kelas_4_6', no: 53, teks: 'Apakah kamu kehilangan minat atau kesenangan dalam kegiatan yang biasanya kamu sukai?', tipe: 'ya_tidak', opsi: yn, kondisi: { kelas: ['4','5','6'] } },
    { kode: 'jiwa_kelas_4_6', no: 54, teks: 'Apakah kamu memiliki pikiran untuk menyakiti diri sendiri atau tidak ingin hidup?', tipe: 'ya_tidak', opsi: yn, kondisi: { kelas: ['4','5','6'] } },

    // REPRODUKSI PUTRI (Q55-58)
    { kode: 'repro_putri', no: 55, teks: 'Apakah kamu sudah mengalami menstruasi (haid)?', tipe: 'ya_tidak', opsi: yn, kondisi: { jenis_kelamin: 'Perempuan' } },
    { kode: 'repro_putri', no: 56, teks: 'Apakah kamu mengalami keputihan yang berbau, berwarna kuning/hijau, atau disertai rasa gatal?', tipe: 'ya_tidak', opsi: yn, kondisi: { jenis_kelamin: 'Perempuan' } },
    { kode: 'repro_putri', no: 57, teks: 'Apakah kamu mengalami rasa gatal, nyeri, atau luka pada area kemaluan?', tipe: 'ya_tidak', opsi: yn, kondisi: { jenis_kelamin: 'Perempuan' } },
    { kode: 'repro_putri', no: 58, teks: 'Apakah ada keluhan lain seputar kesehatan reproduksi?', tipe: 'teks', kondisi: { jenis_kelamin: 'Perempuan' } },

    // REPRODUKSI PUTRA (Q59-62)
    { kode: 'repro_putra', no: 59, teks: 'Apakah kamu mengalami rasa gatal atau kemerahan pada area kemaluan?', tipe: 'ya_tidak', opsi: yn, kondisi: { jenis_kelamin: 'Laki-laki' } },
    { kode: 'repro_putra', no: 60, teks: 'Apakah kamu mengalami nyeri atau rasa tidak nyaman saat Buang Air Kecil (BAK)?', tipe: 'ya_tidak', opsi: yn, kondisi: { jenis_kelamin: 'Laki-laki' } },
    { kode: 'repro_putra', no: 61, teks: 'Apakah kamu memiliki luka atau benjolan yang tidak biasa pada area kemaluan?', tipe: 'ya_tidak', opsi: yn, kondisi: { jenis_kelamin: 'Laki-laki' } },
    { kode: 'repro_putra', no: 62, teks: 'Apakah ada keluhan lain seputar kesehatan reproduksi?', tipe: 'teks', kondisi: { jenis_kelamin: 'Laki-laki' } },

    // PERILAKU MEROKOK (Q63-67)
    { kode: 'merokok', no: 63, teks: 'Apakah kamu pernah atau sedang merokok?', tipe: 'ya_tidak', opsi: yn, skip: { Tidak: 'skip_to_aktivitas' } },
    { kode: 'merokok', no: 64, teks: 'Jenis rokok apa yang kamu gunakan?', tipe: 'pilihan_ganda', opsi: JSON.stringify(['Rokok konvensional','Vape / rokok elektrik','Keduanya']) },
    { kode: 'merokok', no: 65, teks: 'Berapa batang/isap rokok yang kamu konsumsi per hari?', tipe: 'angka' },
    { kode: 'merokok', no: 66, teks: 'Sudah berapa lama kamu merokok?', tipe: 'pilihan_ganda', opsi: JSON.stringify(['< 1 tahun','1-2 tahun','> 2 tahun']) },
    { kode: 'merokok', no: 67, teks: 'Apakah kamu terpapar asap rokok di rumah atau lingkungan sekitar (perokok pasif)?', tipe: 'ya_tidak', opsi: yn },

    // IMUNISASI KELAS 1 (Q68-80)
    { kode: 'imunisasi', no: 68, teks: 'Hepatitis B (3 dosis)', tipe: 'pilihan_ganda', opsi: JSON.stringify(['Lengkap','Tidak Lengkap','Tidak Tahu']), kondisi: { kelas: ['1'] } },
    { kode: 'imunisasi', no: 69, teks: 'BCG (1 dosis)', tipe: 'pilihan_ganda', opsi: JSON.stringify(['Sudah','Belum','Tidak Tahu']), kondisi: { kelas: ['1'] } },
    { kode: 'imunisasi', no: 70, teks: 'OPV 1 (Polio Tetes dosis 1)', tipe: 'pilihan_ganda', opsi: JSON.stringify(['Sudah','Belum','Tidak Tahu']), kondisi: { kelas: ['1'] } },
    { kode: 'imunisasi', no: 71, teks: 'OPV 2 (Polio Tetes dosis 2)', tipe: 'pilihan_ganda', opsi: JSON.stringify(['Sudah','Belum','Tidak Tahu']), kondisi: { kelas: ['1'] } },
    { kode: 'imunisasi', no: 72, teks: 'OPV 3 (Polio Tetes dosis 3)', tipe: 'pilihan_ganda', opsi: JSON.stringify(['Sudah','Belum','Tidak Tahu']), kondisi: { kelas: ['1'] } },
    { kode: 'imunisasi', no: 73, teks: 'OPV 4 (Polio Tetes dosis 4)', tipe: 'pilihan_ganda', opsi: JSON.stringify(['Sudah','Belum','Tidak Tahu']), kondisi: { kelas: ['1'] } },
    { kode: 'imunisasi', no: 74, teks: 'DPT-HB-Hib 1', tipe: 'pilihan_ganda', opsi: JSON.stringify(['Sudah','Belum','Tidak Tahu']), kondisi: { kelas: ['1'] } },
    { kode: 'imunisasi', no: 75, teks: 'DPT-HB-Hib 2', tipe: 'pilihan_ganda', opsi: JSON.stringify(['Sudah','Belum','Tidak Tahu']), kondisi: { kelas: ['1'] } },
    { kode: 'imunisasi', no: 76, teks: 'DPT-HB-Hib 3', tipe: 'pilihan_ganda', opsi: JSON.stringify(['Sudah','Belum','Tidak Tahu']), kondisi: { kelas: ['1'] } },
    { kode: 'imunisasi', no: 77, teks: 'DPT-HB-Hib 4', tipe: 'pilihan_ganda', opsi: JSON.stringify(['Sudah','Belum','Tidak Tahu']), kondisi: { kelas: ['1'] } },
    { kode: 'imunisasi', no: 78, teks: 'IPV (Polio Suntik)', tipe: 'pilihan_ganda', opsi: JSON.stringify(['Sudah','Belum','Tidak Tahu']), kondisi: { kelas: ['1'] } },
    { kode: 'imunisasi', no: 79, teks: 'Campak Rubela (dosis 1)', tipe: 'pilihan_ganda', opsi: JSON.stringify(['Sudah','Belum','Tidak Tahu']), kondisi: { kelas: ['1'] } },
    { kode: 'imunisasi', no: 80, teks: 'MR (Measles Rubella booster / BIAS)', tipe: 'pilihan_ganda', opsi: JSON.stringify(['Sudah','Belum','Tidak Tahu']), kondisi: { kelas: ['1'] } },

    // AKTIVITAS FISIK (Q81-82)
    { kode: 'aktivitas_fisik', no: 81, teks: 'Dalam 7 hari terakhir, berapa hari kamu melakukan aktivitas fisik sedang/berat selama ≥ 60 menit?', tipe: 'angka', kondisi: { kelas: ['4','5','6'] } },
    { kode: 'aktivitas_fisik', no: 82, teks: 'Dalam seminggu biasanya, berapa hari kamu aktif bergerak?', tipe: 'angka', kondisi: { kelas: ['4','5','6'] } },

    // KEBUGARAN (Q83-86)
    { kode: 'kebugaran', no: 83, teks: 'Apakah kamu pernah didiagnosis mengalami masalah pada tulang atau sendi (skoliosis, nyeri sendi, dll)?', tipe: 'ya_tidak', opsi: yn },
    { kode: 'kebugaran', no: 84, teks: 'Apakah kamu pernah didiagnosis mengalami masalah jantung atau tekanan darah tinggi?', tipe: 'ya_tidak', opsi: yn },
    { kode: 'kebugaran', no: 85, teks: 'Apakah kamu pernah didiagnosis mengalami asma atau gangguan pernapasan lainnya?', tipe: 'ya_tidak', opsi: yn },
    { kode: 'kebugaran', no: 86, teks: 'Apakah kamu pernah mengalami pingsan atau pusing berat saat berolahraga?', tipe: 'ya_tidak', opsi: yn },

    // HEPATITIS (Q87-90)
    { kode: 'hepatitis', no: 87, teks: 'Apakah anak anda pernah dinyatakan positif Hepatitis B?', tipe: 'ya_tidak', opsi: yn },
    { kode: 'hepatitis', no: 88, teks: 'Apakah ada anggota keluarga yang menderita Hepatitis B?', tipe: 'ya_tidak', opsi: yn },
    { kode: 'hepatitis', no: 89, teks: 'Apakah anak anda pernah menerima transfusi darah?', tipe: 'ya_tidak', opsi: yn },
    { kode: 'hepatitis', no: 90, teks: 'Apakah anak anda pernah menjalani hemodialisa (cuci darah)?', tipe: 'ya_tidak', opsi: yn },

    // PENYAKIT TROPIS TERABAIKAN (Q91-92)
    { kode: 'penyakit_tropis', no: 91, teks: 'Apakah anak anda memiliki bercak putih pada kulit yang tidak terasa atau mati rasa (kemungkinan kusta)?', tipe: 'ya_tidak', opsi: yn },
    { kode: 'penyakit_tropis', no: 92, teks: 'Apakah anak anda mengalami kudis atau koreng gatal yang tidak sembuh-sembuh?', tipe: 'ya_tidak', opsi: yn },

    // MALARIA (Q93-95)
    { kode: 'malaria', no: 93, teks: 'Apakah anak anda pernah mengalami gejala malaria (demam menggigil, berkeringat dingin, nyeri otot)?', tipe: 'ya_tidak', opsi: yn },
    { kode: 'malaria', no: 94, teks: 'Apakah anak anda pernah didiagnosis menderita malaria sebelumnya?', tipe: 'ya_tidak', opsi: yn },
    { kode: 'malaria', no: 95, teks: 'Apakah ada orang di sekitar tempat tinggal anak anda yang pernah sakit malaria?', tipe: 'ya_tidak', opsi: yn },

    // RIWAYAT PENYAKIT ORTU (Q96)
    { kode: 'riwayat_ortu', no: 96, teks: 'Apakah ada anggota keluarga (ayah, ibu, kakek, nenek) yang menderita penyakit berikut?', tipe: 'checkbox', opsi: JSON.stringify(['Diabetes Mellitus','Hipertensi','Penyakit Jantung','Stroke','Asma','Tuberculosis (TBC)','Kanker','Tidak Ada']) },
    { kode: 'riwayat_ortu', no: 97, teks: 'Apakah ada riwayat penyakit keturunan lainnya yang perlu kami ketahui?', tipe: 'teks' },
  ]

  await prisma.screeningQuestion.deleteMany({ where: { tenantId: tenant.id } })
  let totalQ = 0
  for (const [i, p] of pertanyaanData.entries()) {
    const catId = kategoriMap[p.kode]
    if (!catId) continue
    await prisma.screeningQuestion.create({
      data: {
        tenantId: tenant.id,
        categoryId: catId,
        nomorPertanyaan: p.no,
        teksPertanyaan: p.teks,
        tipeJawaban: p.tipe,
        opsiJawaban: p.opsi ? JSON.parse(p.opsi) : undefined,
        kondisiTampil: p.kondisi ?? undefined,
        skipLogic: p.skip ?? undefined,
        wajib: p.tipe !== 'teks',
        nomorUrut: i,
        aktif: true,
      },
    })
    totalQ++
  }
  console.log(`✅ ${totalQ} pertanyaan skrining CKG berhasil dibuat`)

  // ─── 7. SUBSCRIPTION PLAN ─────────────────────────────────────────────────
  await prisma.subscriptionPlan.upsert({
    where: { kodePaket: 'basic' },
    update: {},
    create: {
      namaPaket: 'Basic',
      kodePaket: 'basic',
      fitur: { dashboard: true, formCKG: true, export: false },
      maksSekolah: 3,
      maksSiswa: 500,
      hargaBulanan: 0,
    },
  })
  console.log(`✅ Subscription plan Basic berhasil dibuat`)

  console.log('\n🎉 Seed selesai! Data awal sistem CKG siap digunakan.')
  console.log('\n📋 LANGKAH SELANJUTNYA:')
  console.log('   1. Buat user admin via Supabase Auth Dashboard')
  console.log('   2. Insert user ke tabel users dengan role admin')
  console.log('   3. Akses /form/ckg?tenant=PKM001 untuk tes form siswa')
  console.log('   4. Login di /login dengan akun admin\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
