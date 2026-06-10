'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatCurrency } from '@/lib/currency';

export default function DashboardCharts({ salesData }) {
  // Aggregate sales by month
  const monthlyData = {};
  
  salesData.forEach(sale => {
    if (!sale.date) return;
    const date = new Date(sale.date || sale.createdat);
    const month = date.toLocaleString('ar-EG', { month: 'short' });
    
    if (!monthlyData[month]) {
      monthlyData[month] = { name: month, المبيعات: 0, المدفوع: 0 };
    }
    monthlyData[month].المبيعات += sale.total;
    monthlyData[month].المدفوع += sale.paidamount || sale.paidAmount || 0;
  });

  const chartData = Object.values(monthlyData).reverse();

  if (chartData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6">حركة المبيعات (الأشهر الأخيرة)</h3>
        <div dir="ltr" style={{ position: 'relative', width: '100%', height: 288 }}>
          <ResponsiveContainer width="100%" height={288} minWidth={0} minHeight={0}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => formatCurrency(value)} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="المبيعات" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
              <Bar dataKey="المدفوع" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6">مؤشر النمو والتطور</h3>
        <div dir="ltr" style={{ position: 'relative', width: '100%', height: 288 }}>
          <ResponsiveContainer width="100%" height={288} minWidth={0} minHeight={0}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line type="monotone" dataKey="المبيعات" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
