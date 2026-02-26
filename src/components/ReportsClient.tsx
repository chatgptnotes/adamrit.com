'use client'

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line
} from 'recharts'
import { Users, BedDouble, Clock, IndianRupee } from 'lucide-react'

interface ReportsClientProps {
  data: {
    genderData: Array<{ name: string; value: number }>
    admissionTypeData: Array<{ name: string; value: number }>
    revenueData: Array<{ date: string; revenue: number }>
    stats: {
      totalPatients: number
      ipdAdmissions: number
      avgStayDays: number
      totalRevenue: number
    }
  }
}

const GENDER_COLORS = ['#3b82f6', '#ef4444'] // Blue for Male, Red for Female
const ADMISSION_COLORS = ['#14b8a6', '#06b6d4'] // Teal for OPD, Cyan for IPD

export function ReportsClient({ data }: ReportsClientProps) {
  const { genderData, admissionTypeData, revenueData, stats } = data

  const statsCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'IPD Admissions',
      value: stats.ipdAdmissions.toLocaleString(),
      icon: BedDouble,
      color: 'bg-green-500'
    },
    {
      title: 'Avg Stay Days',
      value: stats.avgStayDays.toString(),
      icon: Clock,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      color: 'bg-orange-500'
    }
  ]

  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-blue-600">
            Revenue: {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, index) => (
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
        {/* Gender Distribution */}
        <div className="bg-white shadow-sm rounded-xl border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Gender Distribution</h3>
          {genderData.some(d => d.value > 0) ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80">
              <p className="text-gray-500">No gender data available</p>
            </div>
          )}
        </div>

        {/* Admission Type Distribution */}
        <div className="bg-white shadow-sm rounded-xl border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">OPD vs IPD Distribution</h3>
          {admissionTypeData.some(d => d.value > 0) ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={admissionTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80">
              <p className="text-gray-500">No admission type data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Daily Revenue Chart */}
      <div className="bg-white shadow-sm rounded-xl border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Revenue Trend (Last 30 Days)</h3>
        {revenueData.length > 0 ? (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#14b8a6" 
                  strokeWidth={2}
                  dot={{ fill: '#14b8a6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <IndianRupee className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No revenue data</h3>
              <p className="mt-1 text-sm text-gray-500">No billing records found for the chart.</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}