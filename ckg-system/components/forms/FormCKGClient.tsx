'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ProgressBar } from '@/components/forms/ProgressBar'
import { FormSection } from '@/components/forms/DynamicQuestion'
import { submitFormCKG } from '@/actions/form-submission'
import type { ScreeningCategoryDTO } from '@/types'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Send, Loader2, AlertTriangle } from 'lucide-react'

type FormCKGClientProps = {
  tenantId: string
  categories: ScreeningCategoryDTO[]
  schools: { id: string; namaSekolah: string }[]
}

const STEP_CONSENT = 0
const STEP_IDENTITAS_SISWA = 1
const STEP_IDENTITAS_ORTU = 2
const STEP_SKRINING_START = 3

export function FormCKGClient({ tenantId, categories, schools }: FormCKGClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Langkah saat ini: 0=Consent, 1=Identitas Siswa, 2=Data Ortu, 3+=Skrining per kategori
  const [currentStep, setCurrentStep] = useState(STEP_CONSENT)

  // State consent
  const [consent, setConsent] = useState<boolean | null>(null)
  const [alasanTolak, setAlasanTolak] = useState('')

  // State identitas siswa
  const [siswa, setSiswa] = useState({
    nik: '', nisn: '', namaLengkap: '', jenisKelamin: '' as '' | 'Laki-laki' | 'Perempuan',
    tempatLahir: '', tanggalLahir: '', agama: '', golonganDarah: '',
    disabilitas: 'Tidak', schoolId: '', classId: '',
    alamatLengkap: '', kelurahanDomisili: '', kecamatanDomisili: '', kabupatenDomisili: '',
  })

  // State data ortu
  const [ortu, setOrtu] = useState({
    namaWali: '', nikWali: '', tanggalLahirWali: '', alamatWali: '',
    nomorHp: '', emailSiswa: '',
  })

  // State jawaban skrining: {questionId: jawaban}
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [error, setError] = useState<string | null>(null)

  // Hitung kategori skrining yang relevan berdasarkan jenis kelamin & kelas
  const kelasAngka = siswa.classId ? '' : '' // akan diisi setelah pilih kelas

  const activeCategories = categories.filter((cat) => {
    // Semua kategori ditampilkan di step skrining, filter per-pertanyaan di FormSection
    return cat.questions.length > 0
  })

  const totalSteps = STEP_SKRINING_START + activeCategories.length
  const isLastStep = currentStep === totalSteps - 1

  const handleAnswerChange = useCallback(
    (questionId: string, value: string | string[]) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }))
    },
    []
  )

  function nextStep() {
    setError(null)

    // Validasi langkah consent
    if (currentStep === STEP_CONSENT && consent === null) {
      setError('Silakan pilih setuju atau tidak setuju.')
      return
    }

    // Jika tidak setuju, submit langsung
    if (currentStep === STEP_CONSENT && consent === false) {
      handleSubmit(true)
      return
    }

    // Validasi identitas siswa
    if (currentStep === STEP_IDENTITAS_SISWA) {
      if (!siswa.nik || siswa.nik.length !== 16) {
        setError('NIK harus diisi dan berjumlah 16 digit.')
        return
      }
      if (!siswa.namaLengkap) {
        setError('Nama lengkap wajib diisi.')
        return
      }
      if (!siswa.jenisKelamin) {
        setError('Jenis kelamin wajib dipilih.')
        return
      }
      if (!siswa.schoolId) {
        setError('Sekolah wajib dipilih.')
        return
      }
    }

    // Validasi data ortu
    if (currentStep === STEP_IDENTITAS_ORTU) {
      if (!ortu.nomorHp) {
        setError('Nomor HP wajib diisi untuk konfirmasi.')
        return
      }
    }

    setCurrentStep((s) => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function prevStep() {
    setError(null)
    setCurrentStep((s) => Math.max(0, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(noConsentMode = false) {
    startTransition(async () => {
      const result = await submitFormCKG({
        tenantId,
        consent: noConsentMode ? false : true,
        alasanTidakSetuju: noConsentMode ? alasanTolak : undefined,
        student: {
          nik: siswa.nik,
          nisn: siswa.nisn || undefined,
          namaLengkap: siswa.namaLengkap,
          jenisKelamin: siswa.jenisKelamin as 'Laki-laki' | 'Perempuan',
          tempatLahir: siswa.tempatLahir || undefined,
          tanggalLahir: siswa.tanggalLahir || undefined,
          agama: siswa.agama || undefined,
          golonganDarah: siswa.golonganDarah || undefined,
          disabilitas: siswa.disabilitas,
          schoolId: siswa.schoolId,
          classId: siswa.classId,
          alamatLengkap: siswa.alamatLengkap || undefined,
          kelurahanDomisili: siswa.kelurahanDomisili || undefined,
          kecamatanDomisili: siswa.kecamatanDomisili || undefined,
          kabupatenDomisili: siswa.kabupatenDomisili || undefined,
          namaWali: ortu.namaWali || undefined,
          nikWali: ortu.nikWali || undefined,
          tanggalLahirWali: ortu.tanggalLahirWali || undefined,
          alamatWali: ortu.alamatWali || undefined,
          nomorHp: ortu.nomorHp || undefined,
          emailSiswa: ortu.emailSiswa || undefined,
        },
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          jawaban: typeof value === 'string' ? value : undefined,
          jawabanArray: Array.isArray(value) ? value : undefined,
        })),
      })

      if (result.success) {
        router.push(`/form/ckg/success?id=${result.submissionId}`)
      } else {
        setError(result.error)
      }
    })
  }

  const stepLabel = (() => {
    if (currentStep === STEP_CONSENT) return 'Persetujuan (Informed Consent)'
    if (currentStep === STEP_IDENTITAS_SISWA) return 'Identitas Siswa'
    if (currentStep === STEP_IDENTITAS_ORTU) return 'Data Orang Tua / Wali'
    const catIdx = currentStep - STEP_SKRINING_START
    return activeCategories[catIdx]?.namaKategori ?? 'Skrining Kesehatan'
  })()

  const inputClass =
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
  const labelClass = 'block text-sm font-medium text-foreground mb-1'

  return (
    <div className="min-h-screen bg-secondary/30 flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header Form */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-xl mb-3">
            <span className="text-primary-foreground text-xl">🏥</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Form Cek Kesehatan Gratis (CKG)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Program Cek Kesehatan Gratis Anak Sekolah — Puskesmas
          </p>
        </div>

        {/* Progress */}
        <div className="bg-card border border-border rounded-xl p-4">
          <ProgressBar
            currentStep={currentStep + 1}
            totalSteps={totalSteps}
            stepLabel={stepLabel}
          />
        </div>

        {/* Konten Form */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">

          {/* === STEP 0: CONSENT === */}
          {currentStep === STEP_CONSENT && (
            <div className="space-y-5">
              <h2 className="font-semibold text-lg">Informed Consent</h2>
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-foreground/80 space-y-2 border border-border">
                <p className="font-medium">Pernyataan Persetujuan</p>
                <p>
                  Saya menyetujui bahwa data yang saya isi dalam formulir ini
                  digunakan untuk keperluan Program Cek Kesehatan Gratis (CKG)
                  anak sekolah yang diselenggarakan oleh Puskesmas. Data akan
                  dijaga kerahasiaannya dan hanya digunakan untuk keperluan
                  kesehatan anak.
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium">Apakah Anda menyetujui pernyataan di atas?</p>
                <div className="flex gap-3">
                  {[
                    { value: true, label: 'Ya, Saya Setuju', color: 'primary' },
                    { value: false, label: 'Tidak Setuju', color: 'destructive' },
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setConsent(opt.value)}
                      className={cn(
                        'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all',
                        consent === opt.value
                          ? opt.color === 'primary'
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-destructive bg-destructive text-destructive-foreground'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {consent === false && (
                <div className="space-y-2">
                  <label className={labelClass}>
                    Alasan tidak setuju (opsional)
                  </label>
                  <textarea
                    value={alasanTolak}
                    onChange={(e) => setAlasanTolak(e.target.value)}
                    className={cn(inputClass, 'resize-none')}
                    rows={3}
                    placeholder="Tulis alasan Anda..."
                  />
                </div>
              )}
            </div>
          )}

          {/* === STEP 1: IDENTITAS SISWA === */}
          {currentStep === STEP_IDENTITAS_SISWA && (
            <div className="space-y-5">
              <h2 className="font-semibold text-lg">Identitas Siswa</h2>
              <p className="text-sm text-muted-foreground">
                Isi sesuai data pada KTP / Kartu Keluarga
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>
                    NIK <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    value={siswa.nik}
                    onChange={(e) => setSiswa((s) => ({ ...s, nik: e.target.value.replace(/\D/g, '') }))}
                    placeholder="16 digit NIK sesuai KTP/KK"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>NISN (opsional)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={siswa.nisn}
                    onChange={(e) => setSiswa((s) => ({ ...s, nisn: e.target.value.replace(/\D/g, '') }))}
                    placeholder="10 digit NISN"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Nama Lengkap <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={siswa.namaLengkap}
                    onChange={(e) => setSiswa((s) => ({ ...s, namaLengkap: e.target.value }))}
                    placeholder="Nama sesuai KK"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Jenis Kelamin <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={siswa.jenisKelamin}
                    onChange={(e) => setSiswa((s) => ({ ...s, jenisKelamin: e.target.value as 'Laki-laki' | 'Perempuan' }))}
                    className={inputClass}
                  >
                    <option value="">-- Pilih --</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tempat Lahir</label>
                  <input type="text" value={siswa.tempatLahir} onChange={(e) => setSiswa((s) => ({ ...s, tempatLahir: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tanggal Lahir</label>
                  <input type="date" value={siswa.tanggalLahir} onChange={(e) => setSiswa((s) => ({ ...s, tanggalLahir: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Agama</label>
                  <select value={siswa.agama} onChange={(e) => setSiswa((s) => ({ ...s, agama: e.target.value }))} className={inputClass}>
                    <option value="">-- Pilih --</option>
                    {['Islam','Kristen Protestan','Kristen Katolik','Hindu','Buddha','Khonghucu'].map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Golongan Darah</label>
                  <select value={siswa.golonganDarah} onChange={(e) => setSiswa((s) => ({ ...s, golonganDarah: e.target.value }))} className={inputClass}>
                    <option value="">-- Pilih --</option>
                    {['O','A','B','AB','Tidak Diketahui'].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>
                    Sekolah <span className="text-destructive">*</span>
                  </label>
                  <select value={siswa.schoolId} onChange={(e) => setSiswa((s) => ({ ...s, schoolId: e.target.value, classId: '' }))} className={inputClass}>
                    <option value="">-- Pilih Sekolah --</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>{s.namaSekolah}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Alamat Lengkap</label>
                  <textarea value={siswa.alamatLengkap} onChange={(e) => setSiswa((s) => ({ ...s, alamatLengkap: e.target.value }))} rows={2} className={cn(inputClass, 'resize-none')} placeholder="Sesuai KK" />
                </div>
                <div>
                  <label className={labelClass}>Kelurahan / Desa</label>
                  <input type="text" value={siswa.kelurahanDomisili} onChange={(e) => setSiswa((s) => ({ ...s, kelurahanDomisili: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Kecamatan</label>
                  <input type="text" value={siswa.kecamatanDomisili} onChange={(e) => setSiswa((s) => ({ ...s, kecamatanDomisili: e.target.value }))} className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* === STEP 2: DATA ORTU === */}
          {currentStep === STEP_IDENTITAS_ORTU && (
            <div className="space-y-5">
              <h2 className="font-semibold text-lg">Data Orang Tua / Wali</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Nama Orang Tua / Wali</label>
                  <input type="text" value={ortu.namaWali} onChange={(e) => setOrtu((o) => ({ ...o, namaWali: e.target.value }))} className={inputClass} placeholder="Nama ayah / ibu / wali" />
                </div>
                <div>
                  <label className={labelClass}>NIK Wali</label>
                  <input type="text" inputMode="numeric" maxLength={16} value={ortu.nikWali} onChange={(e) => setOrtu((o) => ({ ...o, nikWali: e.target.value.replace(/\D/g, '') }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tanggal Lahir Wali</label>
                  <input type="date" value={ortu.tanggalLahirWali} onChange={(e) => setOrtu((o) => ({ ...o, tanggalLahirWali: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>
                    No. HP (WhatsApp) <span className="text-destructive">*</span>
                  </label>
                  <input type="tel" value={ortu.nomorHp} onChange={(e) => setOrtu((o) => ({ ...o, nomorHp: e.target.value }))} className={inputClass} placeholder="08xx xxxx xxxx" />
                </div>
                <div>
                  <label className={labelClass}>Email (opsional)</label>
                  <input type="email" value={ortu.emailSiswa} onChange={(e) => setOrtu((o) => ({ ...o, emailSiswa: e.target.value }))} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Alamat Wali (kosongkan jika sama dengan siswa)</label>
                  <textarea value={ortu.alamatWali} onChange={(e) => setOrtu((o) => ({ ...o, alamatWali: e.target.value }))} rows={2} className={cn(inputClass, 'resize-none')} />
                </div>
              </div>
            </div>
          )}

          {/* === STEP 3+: SKRINING DINAMIS === */}
          {currentStep >= STEP_SKRINING_START && (
            (() => {
              const catIdx = currentStep - STEP_SKRINING_START
              const cat = activeCategories[catIdx]
              if (!cat) return null
              return (
                <FormSection
                  key={cat.id}
                  namaKategori={cat.namaKategori}
                  nomorUrut={catIdx + 1}
                  totalSeksi={activeCategories.length}
                  questions={cat.questions}
                  answers={answers}
                  onAnswerChange={handleAnswerChange}
                  jenisKelamin={siswa.jenisKelamin || undefined}
                  kelas={undefined}
                />
              )
            })()
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-destructive/10 text-destructive border border-destructive/30 rounded-lg px-4 py-3 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* Navigasi */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0 || isPending}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Sebelumnya
          </button>

          {isLastStep ? (
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isPending ? 'Menyimpan...' : 'Kirim Form CKG'}
            </button>
          ) : (
            <button
              type="button"
              onClick={nextStep}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
