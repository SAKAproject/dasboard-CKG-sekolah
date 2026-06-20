import { Users, ClipboardCheck, AlertCircle } from 'lucide-react'
import { requireRole } from '@/lib/auth'
import { getClassDashboard, getDashboardSummary } from '@/actions/reports'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ClassTable } from '@/components/dashboard/ClassTable'
import { prisma } from '@/lib/prisma'

export default async function GuruDashboardPage() {
  const user = await requireRole(['guru'])

  const sekolah = user.schoolId
    ? await prisma.school.findUnique({
        where: { id: user.schoolId },
        select: { namaSekolah: true },
      })
    : null

  const [summary, kelasRows] = await Promise.all([
    getDashboardSummary(user.tenantId),
    getClassDashboard(user.schoolId ?? undefined),
  ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard Guru</h1>
        <p className="text-muted-foreground mt-1">
          {sekolah
            ? sekolah.namaSekolah
            : 'Belum ada sekolah yang ditetapkan. Hubungi administrator.'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total Siswa"
          value={summary.totalSiswa.toLocaleString('id-ID')}
          icon={<Users className="w-5 h-5" />}
          color="primary"
        />
        <StatsCard
          title="Sudah Isi Form CKG"
          value={summary.totalSubmit.toLocaleString('id-ID')}
          subtitle={`${summary.persentaseIsi}% dari total siswa`}
          icon={<ClipboardCheck className="w-5 h-5" />}
          color="success"
        />
        <StatsCard
          title="Belum Isi Form"
          value={summary.belumIsi.toLocaleString('id-ID')}
          icon={<AlertCircle className="w-5 h-5" />}
          color="warning"
        />
      </div>

      {/* Rincian Per Kelas */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Rincian Per Kelas</h2>
        <ClassTable rows={kelasRows} />
      </div>

      {/* Catatan informasi untuk guru */}
      <div className="bg-muted/40 border border-border rounded-xl p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Informasi</p>
        <p>
          Tampilan ini hanya menampilkan status pengisian form CKG. Untuk melihat
          rincian hasil skrining kesehatan masing-masing siswa, silakan hubungi
          petugas entri atau administrator Puskesmas.
        </p>
      </div>
    </div>
  )
}
