import { supabase } from '@/lib/supabase'
import { Calendar, Users, Stethoscope } from 'lucide-react'

async function getOPDData() {
  try {
    // Get all appointments with patient details
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients!inner(full_name, patient_id)
      `)
      .order('appointment_date', { ascending: false })

    if (error) {
      console.error('Error fetching OPD data:', error)
      return {
        appointments: [],
        totalAppointments: 0,
        uniqueDoctors: 0
      }
    }

    const totalAppointments = appointments?.length || 0
    const uniqueDoctors = new Set(appointments?.map(apt => apt.doctor_id)).size

    return {
      appointments: appointments || [],
      totalAppointments,
      uniqueDoctors
    }
  } catch (error) {
    console.error('Error fetching OPD data:', error)
    return {
      appointments: [],
      totalAppointments: 0,
      uniqueDoctors: 0
    }
  }
}

export default async function OPDPage() {
  const { appointments, totalAppointments, uniqueDoctors } = await getOPDData()

  const summaryCards = [
    {
      title: 'Total Appointments',
      value: totalAppointments.toLocaleString(),
      icon: Calendar,
      color: 'bg-blue-500'
    },
    {
      title: 'Unique Doctors',
      value: uniqueDoctors.toLocaleString(),
      icon: Stethoscope,
      color: 'bg-green-500'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">OPD Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Out-patient department appointments and consultation management
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

      {/* OPD Table */}
      <div className="bg-white shadow-sm rounded-xl border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All OPD Appointments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appointment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {appointment.patients?.full_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Dr. {appointment.doctor_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(appointment.appointment_date).toLocaleDateString('en-IN')}
                    <br />
                    <span className="text-xs text-gray-400">
                      {new Date(appointment.appointment_date).toLocaleTimeString('en-IN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {appointment.notes || 'No notes'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {appointments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
            <p className="mt-1 text-sm text-gray-500">No OPD appointments have been scheduled yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}