import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getScreeningStructure, getActiveSchools } from '@/actions/screening'
import { FormCKGClient } from '@/components/forms/FormCKGClient'

type FormCKGPageProps = {
  searchParams: Promise<{ tenant?: string }>
}

/**
 * Halaman form CKG yang diakses publik (tanpa login).
 * URL: /form/ckg?tenant=KODE_TENANT
 * Siswa/ortu mendapat link ini dari sekolah masing-masing.
 */
export default async function FormCKGPage({ searchParams }: FormCKGPageProps) {
  const params = await searchParams
  const kode = params.tenant

  if (!kode) notFound()

  const tenant = await prisma.tenant.findUnique({
    where: { kodeTenant: kode, statusAktif: true },
    select: { id: true, namaPuskesmas: true },
  })

  if (!tenant) notFound()

  const [categories, schools] = await Promise.all([
    getScreeningStructure(tenant.id),
    getActiveSchools(tenant.id),
  ])

  return (
    <FormCKGClient
      tenantId={tenant.id}
      categories={categories}
      schools={schools}
    />
  )
}
