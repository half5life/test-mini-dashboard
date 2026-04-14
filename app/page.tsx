import { supabase } from '@/lib/supabase'
import DashboardChart from '@/components/DashboardChart'

// Next.js config to disable static generation as we need fresh data from the DB
export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
  }

  const orderData = orders || []
  const totalOrders = orderData.length
  const totalRevenue = orderData.reduce((sum, order) => sum + (order.total_sum || 0), 0)

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Orders Dashboard
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Overview of sales performance and order volume.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {/* Total Orders Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center hover:shadow-md transition-shadow">
            <dt className="text-sm font-medium text-slate-500 mb-2">Total Orders</dt>
            <dd className="text-4xl font-bold tracking-tight text-slate-900">
              {totalOrders}
            </dd>
          </div>
          
          {/* Total Revenue Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center hover:shadow-md transition-shadow">
            <dt className="text-sm font-medium text-slate-500 mb-2">Total Revenue</dt>
            <dd className="text-4xl font-bold tracking-tight text-blue-600">
              {new Intl.NumberFormat('ru-RU').format(totalRevenue)} ₸
            </dd>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Revenue Over Time</h2>
              <p className="text-sm text-slate-500 mt-1">Daily aggregate of completed orders</p>
            </div>
          </div>
          <div className="w-full">
            <DashboardChart data={orderData} />
          </div>
        </div>

      </div>
    </div>
  )
}
