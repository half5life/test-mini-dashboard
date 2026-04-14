'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type OrderData = {
  id: string;
  total_sum: number;
  created_at: string;
  status?: string;
};

export default function DashboardChart({ data }: { data: OrderData[] }) {
  // Process data to group by date
  const chartData = data.reduce((acc: any[], order) => {
    const date = new Date(order.created_at).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.total += order.total_sum;
      existing.count += 1;
    } else {
      acc.push({ date, total: order.total_sum, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="h-[400px] w-full mt-8">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" fill="#3b82f6" name="Total Sum (₸)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
