// @ts-nocheck
import { supabase } from '@/lib/supabase'
import { Users, BedDouble, Calendar, FileCheck, Receipt, IndianRupee, Activity, TrendingUp, Clock, RotateCcw, Wallet, LogIn } from 'lucide-react'
import { PatientTypeChart } from '@/components/PatientTypeChart'
import { RecentAdmissions } from '@/components/RecentAdmissions'

// Hospital configuration
const TOTAL_BEDS = 42 // Ayushman + Hope combined current capacity
const PERIOD_DAYS = 30 // rolling 30-day window for KPIs

async function getDashboardData() {
  try {
    const now = new Date()
    const periodStart = new Date(now.getTime() - PERIOD_DAYS * 24 * 60 * 60 * 1000)
    const periodStartStr = periodStart.toISOString().split('T')[0]

    // ── Base counts ──────────────────────────────────────────────
    const [
      { count: totalPatients },
      { count: ipdCount },
      { count: opdCount },
      { count: dischargeCount },
    ] = await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('ward_patients').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
      supabase.from('discharge_summaries').select('*', { count: 'exact', head: true }),
    ])

    // ── Revenue ───────────────────────────────────────────────────
    const { data: revenueData } = await supabase.from('billings').select('amount')
    const totalRevenue = revenueData?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0

    // ── Patient type split (for chart) ────────────────────────────
    const { data: patientTypes } = await supabase.from('patients').select('admission_type')
    const opdPatients = patientTypes?.filter(p => p.admission_type === 'OPD').length || 0
    const ipdPatients = patientTypes?.filter(p => p.admission_type === 'IPD').length || 0

    // ── Ward patients with dates (for KPI calculations) ────────────
    const { data: wardPatients } = await supabase
      .from('ward_patients')
      .select('in_date, out_date, is_discharge')

    // ── KPI 1: ALOS — Average Length of Stay (days) ───────────────
    // = Total Inpatient Days ÷ Total Discharges
    const dischargedPts = wardPatients?.filter(wp => wp.is_discharge && wp.in_date && wp.out_date) || []
    let totalInpatientDays = 0
    dischargedPts.forEach(wp => {
      const inDate = new Date(wp.in_date)
      const outDate = new Date(wp.out_date)
      const los = Math.max(1, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)))
      totalInpatientDays += los
    })
    const alos = dischargedPts.length > 0
      ? (totalInpatientDays / dischargedPts.length).toFixed(1)
      : '—'

    // ── KPI 2: BOR — Bed Occupancy Rate (%) ────────────────────────
    // = (Total Inpatient Days ÷ Available Bed Days) × 100
    const availableBedDays = TOTAL_BEDS * PERIOD_DAYS
    // Current IPD patients still admitted (active bed occupancy per day estimate)
    const activeIpd = wardPatients?.filter(wp => !wp.is_discharge).length || 0
    const estimatedOccupancyDays = totalInpatientDays + (activeIpd * PERIOD_DAYS / 2) // rough active patient contribution
    const bor = availableBedDays > 0
      ? Math.min(100, Math.round((estimatedOccupancyDays / availableBedDays) * 100))
      : 0

    // ── KPI 3: BTR — Bed Turnover Rate ─────────────────────────────
    // = Total Discharges ÷ Total Beds (per period)
    const btr = TOTAL_BEDS > 0
      ? ((dischargeCount || 0) / TOTAL_BEDS).toFixed(1)
      : '—'

    // ── KPI 4: BTI — Bed Turnover Interval (days) ─────────────────
    // = (Available Bed Days - Inpatient Days) ÷ Total Discharges
    const bti = (dischargeCount || 0) > 0
      ? Math.max(0, ((availableBedDays - totalInpatientDays) / (dischargeCount || 1))).toFixed(1)
      : '—'

    // ── KPI 5: ARPP — Average Revenue Per Patient ─────────────────
    // = Total Revenue ÷ Total Patients
    const arpp = (totalPatients || 0) > 0
      ? Math.round(totalRevenue / totalPatients)
      : 0

    // ── KPI 6: Admission Rate (%) ────────────────────────────────
    // = (Total IPD Admissions ÷ Total Visits) × 100
    const totalVisits = (ipdCount || 0) + (opdCount || 0)
    const admissionRate = totalVisits > 0
      ? Math.round(((ipdCount || 0) / totalVisits) * 100)
      : 0

    return {
      totalPatients: totalPatients || 0,
      ipdCount: ipdCount || 0,
      opdCount: opdCount || 0,
      dischargeCount: dischargeCount || 0,
      totalRevenue,
      patientTypeData: [
        { name: 'OPD', value: opdPatients },
        { name: 'IPD', value: ipdPatients }
      ],
      kpis: {
        alos,
        bor,
        btr,
        bti,
        arpp,
        admissionRate,
        activeIpd,
        totalBeds: TOTAL_BEDS,
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return {
      totalPatients: 0, ipdCount: 0, opdCount: 0, dischargeCount: 0, totalRevenue: 0,
      patientTypeData: [],
      kpis: { alos: '—', bor: 0, btr: '—', bti: '—', arpp: 0, admissionRate: 0, activeIpd: 0, totalBeds: TOTAL_BEDS }
    }
  }
}

export default async function Dashboard() {
  const data = await getDashboardData()
  const { kpis } = data

  const summaryCards = [
    { title: 'Total Patients', value: data.totalPatients.toLocaleString(), icon: Users, color: 'blue' },
    { title: 'IPD Admissions', value: data.ipdCount.toLocaleString(), icon: BedDouble, color: 'purple' },
    { title: 'OPD Visits', value: data.opdCount.toLocaleString(), icon: Calendar, color: 'green' },
    { title: 'Discharges', value: data.dischargeCount.toLocaleString(), icon: FileCheck, color: 'orange' },
    { title: 'Total Revenue', value: `₹${(data.totalRevenue / 100000).toFixed(1)}L`, icon: IndianRupee, color: 'emerald' },
    { title: 'Active IPD', value: kpis.activeIpd.toString(), icon: Activity, color: 'red' },
  ]

  const colorMap: Record<string, string> = {
    blue:    'bg-blue-50 text-blue-600 border-blue-200',
    purple:  'bg-purple-50 text-purple-600 border-purple-200',
    green:   'bg-green-50 text-green-600 border-green-200',
    orange:  'bg-orange-50 text-orange-600 border-orange-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    red:     'bg-red-50 text-red-600 border-red-200',
  }

  const kpiCards = [
    {
      title: 'ALOS',
      subtitle: 'Avg Length of Stay',
      formula: 'Inpatient Days ÷ Discharges',
      value: `${kpis.alos} days`,
      icon: Clock,
      color: 'bg-blue-600',
      benchmark: '< 4 days ideal',
      good: typeof kpis.alos === 'string' && parseFloat(kpis.alos) <= 4,
    },
    {
      title: 'BOR',
      subtitle: 'Bed Occupancy Rate',
      formula: `(Inpatient Days ÷ ${kpis.totalBeds} beds × ${PERIOD_DAYS}d) × 100`,
      value: `${kpis.bor}%`,
      icon: BedDouble,
      color: 'bg-purple-600',
      benchmark: '75–85% ideal',
      good: kpis.bor >= 75 && kpis.bor <= 85,
    },
    {
      title: 'BTR',
      subtitle: 'Bed Turnover Rate',
      formula: `Discharges ÷ ${kpis.totalBeds} beds`,
      value: `${kpis.btr}×`,
      icon: RotateCcw,
      color: 'bg-green-600',
      benchmark: '> 4× per month ideal',
      good: typeof kpis.btr === 'string' && parseFloat(kpis.btr) >= 4,
    },
    {
      title: 'BTI',
      subtitle: 'Bed Turnover Interval',
      formula: '(Avail Bed Days − Inpatient Days) ÷ Discharges',
      value: `${kpis.bti} days`,
      icon: TrendingUp,
      color: 'bg-amber-600',
      benchmark: '< 1 day ideal',
      good: typeof kpis.bti === 'string' && parseFloat(kpis.bti) <= 1,
    },
    {
      title: 'ARPP',
      subtitle: 'Avg Revenue Per Patient',
      formula: 'Total Revenue ÷ Total Patients',
      value: `₹${kpis.arpp.toLocaleString()}`,
      icon: Wallet,
      color: 'bg-emerald-600',
      benchmark: '> ₹5,000 ideal',
      good: kpis.arpp >= 5000,
    },
    {
      title: 'Admission Rate',
      subtitle: 'IPD Conversion Rate',
      formula: '(IPD Admissions ÷ Total Visits) × 100',
      value: `${kpis.admissionRate}%`,
      icon: LogIn,
      color: 'bg-rose-600',
      benchmark: '15–25% ideal',
      good: kpis.admissionRate >= 15 && kpis.admissionRate <= 25,
    },
  ]

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hospital Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Ayushman + Hope Hospital — Live Overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((card) => (
          <div key={card.title} className={`rounded-xl border p-4 ${colorMap[card.color]} flex flex-col gap-1`}>
            <card.icon className="w-5 h-5 mb-1" />
            <div className="text-xl font-bold">{card.value}</div>
            <div className="text-xs font-medium opacity-80">{card.title}</div>
          </div>
        ))}
      </div>

      {/* KPI Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-gray-800">Clinical KPIs</h2>
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Rolling {PERIOD_DAYS} days · {kpis.totalBeds} beds configured</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {kpiCards.map((kpi) => (
            <div key={kpi.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={`${kpi.color} px-4 py-3 flex items-center gap-3`}>
                <kpi.icon className="w-5 h-5 text-white" />
                <div>
                  <div className="text-white font-bold text-sm">{kpi.title}</div>
                  <div className="text-white/80 text-xs">{kpi.subtitle}</div>
                </div>
                <div className="ml-auto text-2xl font-extrabold text-white">{kpi.value}</div>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div className="text-xs text-gray-400 italic">{kpi.formula}</div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${kpi.good ? 'bg-green-500' : 'bg-amber-400'}`} />
                  <span className={`text-xs font-medium ${kpi.good ? 'text-green-600' : 'text-amber-600'}`}>
                    {kpi.benchmark}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Patient Type Distribution</h3>
          <PatientTypeChart data={data.patientTypeData} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Admissions</h3>
          <RecentAdmissions />
        </div>
      </div>

      <div className="text-center text-xs text-gray-300 pt-2">
        adamrit.com · A Bettroi Product · v1.4 · {new Date().toLocaleDateString('en-IN')}
      </div>
    </div>
  )
}
