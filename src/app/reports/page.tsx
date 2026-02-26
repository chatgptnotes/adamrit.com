import { supabase } from '@/lib/supabase'
import { ReportsClient } from '@/components/ReportsClient'

async function getReportsData() {
  try {
    // Get gender distribution
    const { data: patients } = await supabase
      .from('patients')
      .select('sex, admission_type')

    // Get billing data for revenue chart
    const { data: billings } = await supabase
      .from('billings')
      .select('amount, billing_date')
      .order('billing_date', { ascending: true })

    // Get IPD data for calculations
    const { data: wardPatients } = await supabase
      .from('ward_patients')
      .select('in_date, out_date, is_discharge')

    // Process gender distribution
    const genderData = [
      { 
        name: 'Male', 
        value: patients?.filter(p => p.sex?.toLowerCase() === 'male').length || 0 
      },
      { 
        name: 'Female', 
        value: patients?.filter(p => p.sex?.toLowerCase() === 'female').length || 0 
      }
    ]

    // Process admission type distribution
    const admissionTypeData = [
      { 
        name: 'OPD', 
        value: patients?.filter(p => p.admission_type === 'OPD').length || 0 
      },
      { 
        name: 'IPD', 
        value: patients?.filter(p => p.admission_type === 'IPD').length || 0 
      }
    ]

    // Process daily revenue (group by date)
    const revenueByDate: { [key: string]: number } = {}
    billings?.forEach(billing => {
      const date = new Date(billing.billing_date).toLocaleDateString('en-IN')
      revenueByDate[date] = (revenueByDate[date] || 0) + billing.amount
    })

    const revenueData = Object.entries(revenueByDate)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-30) // Last 30 days
      .map(([date, revenue]) => ({
        date,
        revenue
      }))

    // Calculate statistics
    const totalPatients = patients?.length || 0
    const ipdAdmissions = wardPatients?.length || 0
    
    // Calculate average stay days
    const stayDays = wardPatients
      ?.filter(wp => wp.is_discharge && wp.out_date)
      .map(wp => {
        const inDate = new Date(wp.in_date)
        const outDate = new Date(wp.out_date!)
        return Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24))
      }) || []

    const avgStayDays = stayDays.length > 0 
      ? Math.round(stayDays.reduce((sum, days) => sum + days, 0) / stayDays.length * 10) / 10 
      : 0

    const totalRevenue = billings?.reduce((sum, billing) => sum + billing.amount, 0) || 0

    return {
      genderData,
      admissionTypeData,
      revenueData,
      stats: {
        totalPatients,
        ipdAdmissions,
        avgStayDays,
        totalRevenue
      }
    }
  } catch (error) {
    console.error('Error fetching reports data:', error)
    return {
      genderData: [],
      admissionTypeData: [],
      revenueData: [],
      stats: {
        totalPatients: 0,
        ipdAdmissions: 0,
        avgStayDays: 0,
        totalRevenue: 0
      }
    }
  }
}

export default async function ReportsPage() {
  const data = await getReportsData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Hospital performance metrics and data visualization
        </p>
      </div>

      <ReportsClient data={data} />
    </div>
  )
}