import { requireRole } from '@/lib/auth'
import { getCategoriesWithQuestions } from '@/actions/form-builder'
import { FormBuilderClient } from '@/components/dashboard/FormBuilderClient'

export default async function FormBuilderPage() {
  await requireRole(['admin'])
  const categories = await getCategoriesWithQuestions()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Form Builder</h1>
        <p className="text-muted-foreground mt-1">
          Kelola kategori dan pertanyaan skrining CKG tanpa coding. Perubahan
          langsung berlaku di form yang diisi siswa/orang tua.
        </p>
      </div>

      <FormBuilderClient categories={categories} />
    </div>
  )
}
