import { supabase } from '@/lib/supabase'
import { Users, BedDouble, Calendar, FileCheck, Receipt, IndianRupee } from 'lucide-react'
import { PatientTypeChart } from '@/components/PatientTypeChart'
import { RecentAdmissions } from '@/components/RecentAdmissions'

async function getDashboardData() {
  try {
    // Get total patients count
    const { count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })

    // Get IPD count
    const { count: ipdCount } = await supabase
      .from('ward_patients')
      .select('*', { count: 'exact', head: true })

    // Get OPD count
    const { count: opdCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })

    // Get discharge count
    const { count: dischargeCount } = await supabase
      .from('discharge_summaries')
      .select('*', { count: 'exact', head: true })

    // Get total billings count
    const { count: billingsCount } = await supabase
      .from('billings')
      .select('*', { count: 'exact', head: true })

    // Get total revenue
    const { data: revenueData } = await supabase
      .from('billings')
      .select('amount')

    const totalRevenue = revenueData?.reduce((sum, billing) => sum + billing.amount, 0) || 0

    // Get patient type distribution
    const { data: patientTypes } = await supabase
      .from('patients')
      .select('admission_type')

    const opdPatients = patientTypes?.filter(p => p.admission_type === 'OPD').length || 0
    const ipdPatients = patientTypes?.filter(p => p.admission_type === 'IPD').length || 0

    return {
      totalPatients: totalPatients || 0,
      ipdCount: ipdCount || 0,
      opdCount: opdCount || 0,
      dischargeCount: dischargeCount || 0,
      billingsCount: billingsCount || 0,
      totalRevenue,
      patientTypeData: [
        { name: 'OPD', value: opdPatients },
        { name: 'IPD', value: ipdPatients }
      ]
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return {
      totalPatients: 0,
      ipdCount: 0,
      opdCount: 0,
      dischargeCount: 0,
      billingsCount: 0,
      totalRevenue: 0,
      patientTypeData: []
    }
  }
}

export default async function Dashboard() {
  const data = await getDashboardData()

  const kpiCards = [
    {
      title: 'Total Patients',
      value: data.totalPatients.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'IPD Admissions',
      value: data.ipdCount.toLocaleString(),
      icon: BedDouble,
      color: 'bg-teal-500'
    },
    {
      title: 'OPD Appointments',
      value: data.opdCount.toLocaleString(),
      icon: Calendar,
      color: 'bg-green-500'
    },
    {
      title: 'Discharges',
      value: data.dischargeCount.toLocaleString(),
      icon: FileCheck,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Billings',
      value: data.billingsCount.toLocaleString(),
      icon: Receipt,
      color: 'bg-orange-500'
    },
    {
      title: 'Total Revenue',
      value: `₹${data.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      color: 'bg-red-500'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Hospital management system overview and key metrics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((card, index) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Type Distribution */}
        <div className="bg-white shadow-sm rounded-xl border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Type Distribution</h3>
          <PatientTypeChart data={data.patientTypeData} />
        </div>

        {/* Recent IPD Admissions */}
        <div className="bg-white shadow-sm rounded-xl border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent IPD Admissions</h3>
          <RecentAdmissions />
        </div>
      </div>
    </div>
  )
}