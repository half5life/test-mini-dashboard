'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type OrderData = {
  id: string;
  total_sum: number;
  created_at: string;
  status?: string;
};

export default function DashboardChart({ data }: { data: OrderData[] }) {
  // Process data to group by order amount (total_sum) ranges
  const ranges = [
    { label: '0 - 20k ₸', min: 0, max: 20000, count: 0 },
    { label: '20k - 40k ₸', min: 20001, max: 40000, count: 0 },
    { label: '40k - 60k ₸', min: 40001, max: 60000, count: 0 },
    { label: '60k - 80k ₸', min: 60001, max: 80000, count: 0 },
    { label: '80k+ ₸', min: 80001, max: Infinity, count: 0 },
  ];

  data.forEach(order => {
    const sum = order.total_sum || 0;
    const range = ranges.find(r => sum >= r.min && sum <= r.max);
    if (range) {
      range.count += 1;
    }
  });

  return (
    <div className="h-[400px] w-full mt-8">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={ranges}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#3b82f6" name="Orders Count" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
