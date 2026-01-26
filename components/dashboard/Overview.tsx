"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

export async function fetchDashboardStats(storeId: string | null) {
  const res = await fetch(`/api/store/summary?storeId=${storeId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch dashboard overview");
  }
  return res.json();
}

export default function DashboardOverviewPage() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-overview", storeId],
    queryFn: () => fetchDashboardStats(storeId),
    enabled: !!storeId,
  });
  console.log(data);

  if (isLoading) {
    return <Skeleton className="w-full h-[300px] rounded-lg" />;
  }

  const {
    totalRevenue,
    totalOrders,
    totalProducts,
    totalCustomers,
    monthlyStats,
    recentActivities,
  } = data!;

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Revenue" value={`₦${totalRevenue.toLocaleString()}`} />
        <StatCard title="Orders" value={totalOrders} />
        <StatCard title="Products" value={totalProducts} />
        <StatCard title="Customers" value={totalCustomers} />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyStats}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#4f46e5" name="Revenue" />
              <Bar dataKey="orders" fill="#22c55e" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activities */}
      <ActivityFeed activities={recentActivities} />
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-bold text-gray-900">
        {value}
      </CardContent>
    </Card>
  );
}
