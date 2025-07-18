// components/SalesBarChart.tsx
"use client";

import {
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface SalesBarChartProps {
  data: {
    name: string;
    revenue: number;
    orders: number;
  }[];
}

export function SalesBarChart({ data }: SalesBarChartProps) {
  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
          <Bar dataKey="orders" fill="#10b981" name="Orders" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
