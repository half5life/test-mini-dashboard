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
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Orders Mini Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of sales and order volume</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-sm font-medium text-gray-500 mb-1">Total Orders</h2>
          <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-sm font-medium text-gray-500 mb-1">Total Revenue</h2>
          <p className="text-3xl font-bold text-blue-600">
            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT' }).format(totalRevenue)}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue over time</h2>
        <DashboardChart data={orderData} />
      </div>
    </div>
  )
}
