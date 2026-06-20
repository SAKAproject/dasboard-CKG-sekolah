import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

/**
 * Halaman konfirmasi sukses untuk siswa/ortu setelah submit form CKG.
 * TIDAK menampilkan data kesehatan apapun — hanya konfirmasi berhasil.
 * Ini sesuai dengan aturan akses: siswa hanya mendapat pemberitahuan berhasil input.
 */
export default function FormCKGSuccessPage() {
  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center space-y-6">
        {/* Ikon Sukses */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Pesan */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">
            Form Berhasil Dikirim!
          </h1>
          <p className="text-sm text-muted-foreground">
            Data Cek Kesehatan Gratis (CKG) Anda telah berhasil dikirimkan dan
            sedang diproses oleh petugas Puskesmas.
          </p>
        </div>

        {/* Info Selanjutnya */}
        <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2 text-sm border border-border">
          <p className="font-medium text-foreground">Apa yang terjadi selanjutnya?</p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">1.</span>
              Data Anda akan diverifikasi oleh petugas Puskesmas.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">2.</span>
              Guru/wali kelas akan diberitahu status pengisian form.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">3.</span>
              Jika diperlukan pemeriksaan lanjutan, pihak sekolah akan
              menghubungi Anda.
            </li>
          </ul>
        </div>

        {/* Tombol Kembali */}
        <div className="text-xs text-muted-foreground">
          Terima kasih telah berpartisipasi dalam Program Cek Kesehatan Gratis.
        </div>
      </div>
    </div>
  )
}
