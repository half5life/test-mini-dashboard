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
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
      <header className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          Orders Dashboard
        </h1>
        <p className="text-lg text-slate-500 mt-3">
          Overview of sales and order volume
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase mb-2">
            Total Orders
          </h2>
          <p className="text-5xl font-black text-slate-800">
            {totalOrders}
          </p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase mb-2">
            Total Revenue
          </h2>
          <p className="text-4xl font-black text-blue-600">
            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(totalRevenue)}
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            Revenue over time
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Daily aggregate of completed orders
          </p>
        </div>
        <DashboardChart data={orderData} />
      </div>
    </div>
  )
}
