import { supabase } from '@/lib/supabase'
import { PatientsTable } from '@/components/PatientsTable'

async function getPatients() {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching patients:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching patients:', error)
    return []
  }
}

export default async function PatientsPage() {
  const patients = await getPatients()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage and view all patient records ({patients.length} total patients)
        </p>
      </div>

      <div className="bg-white shadow-sm rounded-xl border">
        <PatientsTable patients={patients} />
      </div>
    </div>
  )
}