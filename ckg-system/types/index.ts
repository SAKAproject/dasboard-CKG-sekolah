export type TipeJawaban =
  | 'ya_tidak'
  | 'pilihan_ganda'
  | 'dropdown'
  | 'checkbox'
  | 'angka'
  | 'teks'
  | 'tanggal'

export type ScreeningQuestionDTO = {
  id: string
  categoryId: string
  nomorPertanyaan: number
  teksPertanyaan: string
  tipeJawaban: TipeJawaban
  opsiJawaban: string[] | null
  wajib: boolean
  skipLogic: Record<string, string> | null
  kondisiTampil: { kelas?: string[]; jenis_kelamin?: string } | null
  nomorUrut: number
}

export type ScreeningCategoryDTO = {
  id: string
  namaKategori: string
  kodeKategori: string
  nomorUrut: number
  targetKelas: string | null
  questions: ScreeningQuestionDTO[]
}

export type StudentIdentitasInput = {
  nik: string
  nisn?: string
  namaLengkap: string
  jenisKelamin: 'Laki-laki' | 'Perempuan'
  tempatLahir?: string
  tanggalLahir?: string
  agama?: string
  golonganDarah?: string
  disabilitas?: string
  schoolId: string
  classId: string
  alamatLengkap?: string
  kelurahanDomisili?: string
  kecamatanDomisili?: string
  kabupatenDomisili?: string
  namaWali?: string
  nikWali?: string
  tanggalLahirWali?: string
  alamatWali?: string
  nomorHp?: string
  emailSiswa?: string
}

export type SubmitFormCKGInput = {
  tenantId: string
  consent: boolean
  alasanTidakSetuju?: string
  student: StudentIdentitasInput
  answers: {
    questionId: string
    jawaban?: string
    jawabanArray?: string[]
  }[]
}

export type ClassDashboardRow = {
  classId: string
  namaKelas: string
  klasifikasiKelas: string | null
  totalSiswa: number
  sudahIsi: number
  belumIsi: number
  persentase: number
}

export type SubmissionRow = {
  submissionId: string
  namaSiswa: string
  nik: string
  namaKelas: string | null
  namaSekolah: string | null
  tanggalSubmit: Date | null
  sudahDiinputSistem: boolean
  diinputOlehNama: string | null
  diinputPada: Date | null
}
