// @ts-nocheck
import { supabase } from '@/lib/supabase'
import { BedDouble, UserCheck, UserX } from 'lucide-react'

async function getIPDData() {
  try {
    // Get all ward patients
    const { data: wardPatients, error } = await supabase
      .from('ward_patients')
      .select('*')
      .order('in_date', { ascending: false })

    if (error) {
      console.error('Error fetching IPD data:', error)
      return {
        wardPatients: [],
        totalAdmissions: 0,
        currentlyAdmitted: 0,
        discharged: 0
      }
    }

    const totalAdmissions = wardPatients?.length || 0
    const currentlyAdmitted = wardPatients?.filter(wp => !wp.is_discharge).length || 0
    const discharged = wardPatients?.filter(wp => wp.is_discharge).length || 0

    // Get patient details
    let wardPatientsWithNames = wardPatients || []
    if (wardPatients && wardPatients.length > 0) {
      const patientIds = wardPatients.map(wp => wp.legacy_patient_id)
      const { data: patients } = await supabase
        .from('patients')
        .select('legacy_id, full_name, patient_id')
        .in('legacy_id', patientIds)

      wardPatientsWithNames = wardPatients.map(admission => {
        const patient = patients?.find(p => p.legacy_id === admission.legacy_patient_id)
        return {
          ...admission,
          patients: patient ? { full_name: patient.full_name, patient_id: patient.patient_id } : null
        }
      })
    }

    return {
      wardPatients: wardPatientsWithNames,
      totalAdmissions,
      currentlyAdmitted,
      discharged
    }
  } catch (error) {
    console.error('Error fetching IPD data:', error)
    return {
      wardPatients: [],
      totalAdmissions: 0,
      currentlyAdmitted: 0,
      discharged: 0
    }
  }
}

export default async function IPDPage() {
  const { wardPatients, totalAdmissions, currentlyAdmitted, discharged } = await getIPDData()

  const calculateDaysStayed = (inDate: string, outDate?: string) => {
    const admissionDate = new Date(inDate)
    const dischargeDate = outDate ? new Date(outDate) : new Date()
    const diffTime = Math.abs(dischargeDate.getTime() - admissionDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const summaryCards = [
    {
      title: 'Total Admissions',
      value: totalAdmissions.toLocaleString(),
      icon: BedDouble,
      color: 'bg-blue-500'
    },
    {
      title: 'Currently Admitted',
      value: currentlyAdmitted.toLocaleString(),
      icon: UserCheck,
      color: 'bg-green-500'
    },
    {
      title: 'Discharged',
      value: discharged.toLocaleString(),
      icon: UserX,
      color: 'bg-gray-500'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">IPD Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          In-patient department admissions and discharge management
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((card, index) => (
          <div key={index} className="bg-white overflow-hidden shadow-sm rounded-xl border">
            <div className="p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${card.color}`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 truncate">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* IPD Table */}
      <div className="bg-white shadow-sm rounded-xl border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All IPD Admissions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ward
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admitted Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discharged Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Stayed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {wardPatients.map((admission) => (
                <tr key={admission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {admission.patients?.full_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Ward {admission.ward_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Room {admission.room_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Bed {admission.bed_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(admission.in_date).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {admission.out_date 
                      ? new Date(admission.out_date).toLocaleDateString('en-IN') 
                      : 'Still Admitted'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculateDaysStayed(admission.in_date, admission.out_date)} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
        {wardPatients.length === 0 && (
          <div className="text-center py-12">
            <BedDouble className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No IPD admissions found</h3>
            <p className="mt-1 text-sm text-gray-500">No in-patient admissions have been recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
