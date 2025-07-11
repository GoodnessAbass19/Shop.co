// components/seller/DashboardOverview.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  Loader2,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, getMonth, getYear, subMonths } from "date-fns";
import { useSellerStore } from "@/Hooks/use-store-context";
import { formatCurrencyValue } from "@/utils/format-currency-value";

// Define the shape of the data expected from the API
// interface DashboardSummary {
//   totalRevenue: number;
//   monthlyRevenue: number;
//   totalOrders: number;
//   monthlyOrders: number;
//   totalProducts: number;
//   totalCustomers: number;
//   recentActivities: Array<{
//     id: string;
//     type: "ORDER" | "STOCK_LOW" | "PAYOUT" | "REVIEW";
//     message: string;
//     timestamp: string;
//   }>;
// }

interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  topProducts: TopProduct[];
  totalCustomers: number;
  recentActivities: RecentActivity[];
  monthlyStats: MonthlyStat[];
}

interface TopProduct {
  id: string;
  name: string;
  soldCount: number;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

interface MonthlyStat {
  month: string;
  revenue: number;
  orders: number;
}

// Function to fetch dashboard summary data for a specific store
const fetchDashboardSummary = async (
  storeId: string
): Promise<DashboardSummary> => {
  const res = await fetch(`/api/store/summary?storeId=${storeId}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch dashboard summary.");
  }
  return res.json();
};

export function DashboardOverview() {
  const { store } = useSellerStore(); // Get store data from context

  const { data, isLoading, isError, error } = useQuery<DashboardSummary, Error>(
    {
      queryKey: ["sellerDashboardSummary", store.id],
      queryFn: () => fetchDashboardSummary(store.id),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      // No 'enabled' needed here because if this component renders, store.id is guaranteed
      // to be available from the layout's data fetch.
    }
  );

  if (isLoading) {
    return (
      <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <div className="text-red-600 text-center py-8">
        Error loading dashboard data:{" "}
        {error?.message || "An unknown error occurred."}
        <p className="text-sm mt-2">Please try refreshing the page.</p>
      </div>
    );
  }

  const {
    totalRevenue,
    monthlyStats,
    totalOrders,
    totalProducts,
    totalCustomers,
    recentActivities,
  } = data || {
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalOrders: 0,
    monthlyOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    recentActivities: [],
  };

  const now = new Date();
  const currentMonth = getMonth(now); // 0-indexed (0 = January)
  const currentYear = getYear(now);

  // Find current month stat
  const currentMonthStat = monthlyStats?.find((stat) => {
    const statDate = new Date(stat.month);
    return (
      getMonth(statDate) === currentMonth && getYear(statDate) === currentYear
    );
  });

  // Find previous month stat
  const prevMonthDate = subMonths(now, 1);
  const prevMonth = getMonth(prevMonthDate);
  const prevYear = getYear(prevMonthDate);

  const prevMonthStat = monthlyStats?.find((stat) => {
    const statDate = new Date(stat.month);
    return getMonth(statDate) === prevMonth && getYear(statDate) === prevYear;
  });

  const monthlyRevenue = currentMonthStat?.revenue || 0;
  const monthlyOrders = currentMonthStat?.orders || 0;
  const prevMonthlyRevenue = prevMonthStat?.revenue || 0;
  const prevMonthlyOrders = prevMonthStat?.orders || 0;

  // Calculate percentage difference (avoid division by zero)
  const revenueDiff =
    prevMonthlyRevenue === 0
      ? monthlyRevenue === 0
        ? 0
        : 100
      : ((monthlyRevenue - prevMonthlyRevenue) / prevMonthlyRevenue) * 100;

  const ordersDiff =
    prevMonthlyOrders === 0
      ? monthlyOrders === 0
        ? 0
        : 100
      : ((monthlyOrders - prevMonthlyOrders) / prevMonthlyOrders) * 100;

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Dashboard Overview for {store.name}
      </h2>

      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue Card */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue (All Time)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrencyValue(totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all time</p>
          </CardContent>
        </Card>

        {/* Monthly Revenue Card */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue This Month
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col items-start space-y-1">
            <div className="text-2xl font-bold">
              {formatCurrencyValue(monthlyRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Current month</p>
            <span
              className={`font-semibold text-xs flex flex-row gap-1 items-center ${
                revenueDiff > 0
                  ? "text-green-600"
                  : revenueDiff < 0
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {revenueDiff > 0 ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {ordersDiff > 0 ? "+" : "-"}
              {revenueDiff.toFixed(1)}%
            </span>
          </CardContent>
        </Card>

        {/* Total Orders Card */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Orders (All Time)
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Across all time</p>
          </CardContent>
        </Card>

        {/* Monthly Orders Card */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Orders This Month
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col items-start space-y-1">
            <div className="text-2xl font-bold">{monthlyOrders}</div>
            <p className="text-xs text-muted-foreground">Current month</p>
            <span
              className={`font-semibold text-xs flex flex-row items-center gap-1 ${
                ordersDiff > 0
                  ? "text-green-600"
                  : ordersDiff < 0
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {ordersDiff > 0 ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {ordersDiff > 0 ? "+" : "-"}
              {ordersDiff.toFixed(1)}%
            </span>
          </CardContent>
        </Card>

        {/* Products Listed Card */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Products Listed
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Total products in store
            </p>
          </CardContent>
        </Card>

        {/* Customers Reached Card */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Customers Reached
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Unique buyers</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Info className="h-5 w-5 mr-2 text-gray-700" /> Recent Activities
        </h3>
        {recentActivities.length > 0 ? (
          <ul className="space-y-3 text-gray-700">
            {recentActivities.map((activity) => (
              <li
                key={activity.id}
                className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0"
              >
                <span className="flex-1">{activity.message}</span>
                <span className="text-sm text-gray-500 ml-4">
                  {format(new Date(activity.timestamp), "MMM dd, yyyy HH:mm")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No recent activities to display.</p>
        )}
      </div>
    </div>
  );
}
