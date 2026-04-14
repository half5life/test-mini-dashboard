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
    <div className="font-serif text-black min-h-screen bg-white" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '1200px', padding: '3rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 className="text-5xl font-bold mb-6">
            Orders Dashboard
          </h1>
          <p className="text-2xl text-gray-800">
            Overview of sales and order volume
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4rem' }}>
          <div style={{ border: '1px solid black', display: 'inline-flex', textAlign: 'left' }}>
            <div style={{ borderRight: '1px solid black', display: 'flex', alignItems: 'center' }}>
              <h2 className="font-bold text-3xl" style={{ margin: '2.5rem 4rem', whiteSpace: 'nowrap' }}>
                Total Orders: {totalOrders}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h2 className="font-bold text-3xl" style={{ margin: '2.5rem 4rem', whiteSpace: 'nowrap' }}>
                Total Revenue: {new Intl.NumberFormat('ru-RU').format(totalRevenue)} KZT
              </h2>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 className="text-4xl font-bold">
              Revenue over time
            </h2>
            <p className="text-2xl text-gray-800 mt-4">
              Daily aggregate of completed orders
            </p>
          </div>
          <div style={{ border: '1px solid black', padding: '1.5rem', width: '100%', maxWidth: '800px' }}>
            <DashboardChart data={orderData} />
          </div>
        </div>
      </div>
    </div>
  )
}

