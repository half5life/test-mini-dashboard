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
    <div className="font-serif text-black min-h-screen bg-white">
      <div className="pt-12 pb-0 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Orders Dashboard
        </h1>
        <p className="text-xl mb-10">
          Overview of sales and order volume
        </p>

        <div className="flex justify-center px-4">
          <div className="flex border-t border-l border-r border-black w-full max-w-2xl text-left">
            <div className="w-1/2 border-r border-black p-4 pb-6 flex flex-col justify-between min-h-[140px]">
              <h2 className="font-bold text-2xl uppercase">Total Orders</h2>
              <p className="text-xl mt-8">{totalOrders}</p>
            </div>
            <div className="w-1/2 p-4 pb-6 flex flex-col justify-between min-h-[140px]">
              <h2 className="font-bold text-2xl uppercase">Total Revenue</h2>
              <p className="text-xl mt-8">
                {new Intl.NumberFormat('ru-RU').format(totalRevenue)} KZT
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <hr className="border-t border-black w-full m-0" />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 text-center">
        <div className="mb-6">
          <h2 className="text-3xl font-bold">
            Revenue over time
          </h2>
          <p className="text-lg mt-2">
            Daily aggregate of completed orders
          </p>
        </div>
        <div className="border border-black p-4">
          <DashboardChart data={orderData} />
        </div>
      </div>
    </div>
  )
}

