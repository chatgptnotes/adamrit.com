// @ts-nocheck
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Heart } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

async function getPatientData(id: string) {
  try {
    // Get patient details
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('legacy_id', id)
      .single()

    if (patientError || !patient) {
      return null
    }

    // Get ward admissions
    const { data: wardAdmissions } = await supabase
      .from('ward_patients')
      .select('*')
      .eq('legacy_patient_id', id)
      .order('in_date', { ascending: false })

    // Get billings
    const { data: billings } = await supabase
      .from('billings')
      .select('*')
      .eq('legacy_patient_id', id)
      .order('billing_date', { ascending: false })

    // Get discharge summaries
    const { data: dischargeSummaries } = await supabase
      .from('discharge_summaries')
      .select('*')
      .eq('legacy_patient_id', id)
      .order('discharge_date', { ascending: false })

    return {
      patient,
      wardAdmissions: wardAdmissions || [],
      billings: billings || [],
      dischargeSummaries: dischargeSummaries || []
    }
  } catch (error) {
    console.error('Error fetching patient data:', error)
    return null
  }
}

export default async function PatientDetailPage({ params }: Props) {
  const { id } = await params
  const data = await getPatientData(id)

  if (!data) {
    notFound()
  }

  const { patient, wardAdmissions, billings, dischargeSummaries } = data

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const totalBilled = billings.reduce((sum, billing) => sum + billing.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/patients"
          className="flex items-center text-teal-600 hover:text-teal-700"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Patients
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">{patient.full_name}</h1>
        <p className="mt-1 text-sm text-gray-500">Patient ID: {patient.patient_id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demographics Card */}
        <div className="bg-white shadow-sm rounded-xl border p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-teal-600" />
            Demographics
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="text-sm text-gray-900">{patient.full_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Age</dt>
                <dd className="text-sm text-gray-900">{calculateAge(patient.dob)} years</dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Sex</dt>
                <dd className="text-sm text-gray-900">{patient.sex}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Blood Group</dt>
                <dd className="text-sm text-gray-900 flex items-center">
                  <Heart className="h-4 w-4 mr-1 text-red-500" />
                  {patient.blood_group || 'N/A'}
                </dd>
              </div>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Contact</dt>
              <dd className="text-sm text-gray-900 space-y-1">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  {patient.mobile_phone}
                </div>
                {patient.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {patient.email}
                  </div>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="text-sm text-gray-900 flex items-start">
                <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div>{patient.address}</div>
                  <div>{patient.city}, {patient.state} {patient.zip_code}</div>
                </div>
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Admission Type</dt>
                <dd>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    patient.admission_type === 'IPD' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {patient.admission_type}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Emergency Contact</dt>
                <dd className="text-sm text-gray-900">{patient.emergency_contact}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-xl border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{wardAdmissions.length}</div>
                <div className="text-sm text-gray-500">IPD Admissions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{billings.length}</div>
                <div className="text-sm text-gray-500">Billing Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">₹{totalBilled.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Billed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{dischargeSummaries.length}</div>
                <div className="text-sm text-gray-500">Discharges</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* IPD History */}
      {wardAdmissions.length > 0 && (
        <div className="bg-white shadow-sm rounded-xl border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">IPD History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ward</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discharged</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wardAdmissions.map((admission) => (
                  <tr key={admission.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Ward {admission.ward_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Room {admission.room_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Bed {admission.bed_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(admission.in_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admission.out_date ? new Date(admission.out_date).toLocaleDateString('en-IN') : 'N/A'}
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
        </div>
      )}

      {/* Billing History */}
      {billings.length > 0 && (
        <div className="bg-white shadow-sm rounded-xl border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Billing History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {billings.map((billing) => (
                  <tr key={billing.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(billing.billing_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{billing.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{billing.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        billing.payment_status === 'Paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {billing.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Discharge Information */}
      {dischargeSummaries.length > 0 && (
        <div className="bg-white shadow-sm rounded-xl border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Discharge Information</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discharge Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discharge Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dischargeSummaries.map((discharge) => (
                  <tr key={discharge.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(discharge.discharge_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {discharge.discharge_type}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
