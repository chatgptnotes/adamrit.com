import { supabase } from '@/lib/supabase'

async function getRecentAdmissions() {
  try {
    const { data: wardPatients, error } = await supabase
      .from('ward_patients')
      .select(`
        *,
        patients!inner(full_name, patient_id)
      `)
      .order('in_date', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching recent admissions:', error)
      return []
    }

    return wardPatients || []
  } catch (error) {
    console.error('Error fetching recent admissions:', error)
    return []
  }
}

export async function RecentAdmissions() {
  const admissions = await getRecentAdmissions()

  if (!admissions || admissions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No recent admissions found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Patient
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ward
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Admitted Date
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {admissions.map((admission, index) => (
            <tr key={admission.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                {admission.patients?.full_name || 'N/A'}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                Ward {admission.ward_id}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                {new Date(admission.in_date).toLocaleDateString('en-IN')}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  admission.is_discharge 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {admission.is_discharge ? 'Discharged' : 'Admitted'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}