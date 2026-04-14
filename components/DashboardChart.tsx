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
  const grouped = data.reduce((acc: Record<string, { total: number; count: number; rawDate: string }>, order) => {
    const dateObj = new Date(order.created_at);
    const dateKey = dateObj.toISOString().split('T')[0];
    
    if (!acc[dateKey]) {
      acc[dateKey] = {
        total: 0,
        count: 0,
        rawDate: dateKey
      };
    }
    acc[dateKey].total += order.total_sum;
    acc[dateKey].count += 1;
    return acc;
  }, {});

  const chartData = Object.values(grouped)
    .sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime())
    .map(item => {
      const d = new Date(item.rawDate);
      return {
        ...item,
        dateFormatted: d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
      };
    });

  if (chartData.length === 0) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center text-slate-400">
        No data available
      </div>
    );
  }

  return (
    <div className="h-[380px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="dateFormatted" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 13 }} 
            dy={12}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 13 }} 
            dx={-12}
            tickFormatter={(value) => {
              if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
              if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
              return value;
            }}
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              padding: '12px'
            }}
            formatter={(value: number) => [value.toLocaleString('ru-RU') + ' ₸', 'Выручка']}
            labelStyle={{ color: '#0f172a', fontWeight: 600, marginBottom: '6px' }}
          />
          <Bar 
            dataKey="total" 
            fill="#3b82f6" 
            radius={[6, 6, 0, 0]} 
            maxBarSize={48}
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
