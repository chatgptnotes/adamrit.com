// @ts-nocheck
import { supabase } from '@/lib/supabase'
import { Receipt, IndianRupee, CheckCircle, AlertCircle } from 'lucide-react'

async function getBillingData() {
  try {
    // Get all billings
    const { data: billings, error } = await supabase
      .from('billings')
      .select('*')
      .order('billing_date', { ascending: false })

    if (error) {
      console.error('Error fetching billing data:', error)
      return {
        billings: [],
        totalRevenue: 0,
        totalBills: 0,
        paidCount: 0,
        pendingCount: 0
      }
    }

    const totalBills = billings?.length || 0
    const totalRevenue = billings?.reduce((sum, billing) => sum + billing.amount, 0) || 0
    const paidCount = billings?.filter(billing => billing.payment_status?.toLowerCase() === 'paid').length || 0
    const pendingCount = billings?.filter(billing => billing.payment_status?.toLowerCase() !== 'paid').length || 0

    // Get patient details
    let billingsWithNames = billings || []
    if (billings && billings.length > 0) {
      const patientIds = billings.map(billing => billing.legacy_patient_id)
      const { data: patients } = await supabase
        .from('patients')
        .select('legacy_id, full_name, patient_id')
        .in('legacy_id', patientIds)

      billingsWithNames = billings.map(billing => {
        const patient = patients?.find(p => p.legacy_id === billing.legacy_patient_id)
        return {
          ...billing,
          patients: patient ? { full_name: patient.full_name, patient_id: patient.patient_id } : null
        }
      })
    }

    return {
      billings: billingsWithNames,
      totalRevenue,
      totalBills,
      paidCount,
      pendingCount
    }
  } catch (error) {
    console.error('Error fetching billing data:', error)
    return {
      billings: [],
      totalRevenue: 0,
      totalBills: 0,
      paidCount: 0,
      pendingCount: 0
    }
  }
}

export default async function BillingPage() {
  const { billings, totalRevenue, totalBills, paidCount, pendingCount } = await getBillingData()

  const summaryCards = [
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      color: 'bg-green-500'
    },
    {
      title: 'Total Bills',
      value: totalBills.toLocaleString(),
      icon: Receipt,
      color: 'bg-blue-500'
    },
    {
      title: 'Paid Bills',
      value: paidCount.toLocaleString(),
      icon: CheckCircle,
      color: 'bg-teal-500'
    },
    {
      title: 'Pending Bills',
      value: pendingCount.toLocaleString(),
      icon: AlertCircle,
      color: 'bg-orange-500'
    }
  ]

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Hospital billing records and payment tracking
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Billing Table */}
      <div className="bg-white shadow-sm rounded-xl border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Billing Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Billing Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {billings.map((billing) => (
                <tr key={billing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div>
                      <div className="font-medium">{billing.patients?.full_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">ID: {billing.patients?.patient_id || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ₹{billing.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(billing.billing_date).toLocaleDateString('en-IN')}
                    <br />
                    <span className="text-xs text-gray-400">
                      {new Date(billing.billing_date).toLocaleTimeString('en-IN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(billing.payment_status)}`}>
                      {billing.payment_status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                    <div className="truncate" title={billing.description}>
                      {billing.description || 'No description'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {billings.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No billing records found</h3>
            <p className="mt-1 text-sm text-gray-500">No billing records have been created yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
