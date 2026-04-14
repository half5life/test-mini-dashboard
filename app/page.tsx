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
    <div className="font-serif text-black min-h-screen bg-white flex flex-col items-center">
      <div className="w-full max-w-4xl px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6">
            Orders Dashboard
          </h1>
          <p className="text-2xl text-gray-800">
            Overview of sales and order volume
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex border border-black text-left">
            <div className="border-r border-black p-6 sm:p-8 flex flex-col justify-between">
              <h2 className="font-bold text-2xl sm:text-3xl uppercase whitespace-nowrap">Total Orders</h2>
              <p className="text-3xl sm:text-4xl mt-8">{totalOrders}</p>
            </div>
            <div className="p-6 sm:p-8 flex flex-col justify-between">
              <h2 className="font-bold text-2xl sm:text-3xl uppercase whitespace-nowrap">Total Revenue</h2>
              <p className="text-3xl sm:text-4xl mt-8">
                {new Intl.NumberFormat('ru-RU').format(totalRevenue)} KZT
              </p>
            </div>
          </div>
        </div>
        
        <hr className="border-t-2 border-black w-full my-12" />

        <div className="text-center">
          <div className="mb-8">
            <h2 className="text-4xl font-bold">
              Revenue over time
            </h2>
            <p className="text-2xl text-gray-800 mt-4">
              Daily aggregate of completed orders
            </p>
          </div>
          <div className="border border-black p-6">
            <DashboardChart data={orderData} />
          </div>
        </div>
      </div>
    </div>
  )
}

