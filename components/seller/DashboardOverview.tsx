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
  Eye,
  LineChartIcon,
  BarChart2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, getMonth, getYear, subMonths } from "date-fns";
import { useSellerStore } from "@/Hooks/use-store-context";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import { OrdersApiResponse, OrderWithRelations } from "./OrderManagement";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { Button } from "../ui/button";
import { OrderStatus } from "@prisma/client";
import { FILTER_OPTIONS, SalesAnalyticsData } from "./SalesAnalytics";
import Image from "next/image";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart as RechartsBarChart, // Renamed to avoid conflict with BarChart2 icon
  LineChart as RechartsLineChart,
  Bar,
  Line,
} from "recharts";
import { HoverPrefetchLink } from "@/lib/HoverLink";

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

const fetchSellerOrders = async ({
  queryKey,
}: {
  queryKey: (string | number | undefined)[];
}): Promise<OrdersApiResponse> => {
  const [_key, storeId, statusFilter, searchQuery, page, pageSize] = queryKey;
  const queryParams = new URLSearchParams();

  if (storeId) queryParams.append("storeId", storeId.toString());

  const res = await fetch(`/api/store/orders?${queryParams.toString()}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch orders.");
  }
  return res.json();
};

const fetchSalesAnalytics = async (storeId: string) => {
  const res = await fetch(`/api/store/sales-analytics?storeId=${storeId}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch sales analytics data.");
  }
  return res.json();
};

export function DashboardOverview() {
  const { store } = useSellerStore(); // Get store data from context

  const { data, isLoading, isError, error } = useQuery<DashboardSummary, Error>(
    {
      queryKey: ["sellerDashboardSummary", store.id],
      queryFn: () => fetchDashboardSummary(store.id),
      staleTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      // No 'enabled' needed here because if this component renders, store.id is guaranteed
      // to be available from the layout's data fetch.
    }
  );

  const { data: sales, isLoading: salesLoading } = useQuery<
    SalesAnalyticsData,
    Error
  >({
    queryKey: ["salesAnalytics", store?.id],
    queryFn: () => {
      if (!store?.id) throw new Error("Store ID is missing.");
      return fetchSalesAnalytics(store.id);
    },
    enabled: !!store.id,
  });

  const { data: order, isLoading: orderLoading } = useQuery<
    OrdersApiResponse,
    Error
  >({
    queryKey: ["sellerOrders", store.id],
    queryFn: fetchSellerOrders as any, // Type assertion to ensure correct return type
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    enabled: !!store.id, // Only run query if storeId is available
  });
  const orders = order?.orders || [];

  if (isLoading || orderLoading) {
    return (
      <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </section>
    );
  }

  // if (isError) {
  //   return (
  //     <div className="text-red-600 text-center py-8">
  //       Error loading dashboard data:{" "}
  //       {error?.message || "An unknown error occurred."}
  //       <p className="text-sm mt-2">Please try refreshing the page.</p>
  //     </div>
  //   );
  // }

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

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PAID:
        return "success"; // Assuming you have a 'success' variant
      case OrderStatus.PENDING:
        return "warning"; // Assuming 'warning' variant
      case OrderStatus.SHIPPED:
        return "info"; // Assuming 'info' variant
      case OrderStatus.DELIVERED:
        return "default";
      case OrderStatus.CANCELLED:
        return "destructive";
      case OrderStatus.REFUNDED:
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusDisplayName = (status: OrderStatus) => {
    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const { salesChartData, topSellingProducts } = sales || {
    totalRevenue: 0,
    totalOrders: 0,
    salesChartData: [],
    topSellingProducts: [],
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-medium mb-6">
        <span className="font-bold">Hey there,</span> here is a resume of where{" "}
        {store.name} is at right now
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
        {/* <Card className="shadow-md">
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
        </Card> */}

        {/* Customers Reached Card */}
        {/* <Card className="shadow-md">
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
        </Card> */}
      </div>

      {/* Sales Graph    */}
      <div className="grid grid-col-1 md:grid-cols-3 gap-6 mt-4 justify-center items-stretch">
        <Card className="shadow-md w-full col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <LineChartIcon className="h-5 w-5 mr-2" /> Monthly Sales & Orders
              Sale Graph
            </CardTitle>
          </CardHeader>
          <CardContent className="h-96 w-full">
            {salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart
                  data={salesChartData}
                  margin={{ top: 5, bottom: 5 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e0e0e0"
                  />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} />
                  <YAxis
                    yAxisId="left"
                    stroke="#8884d8"
                    fontSize={12}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#82ca9d"
                    fontSize={12}
                    tickFormatter={(value) => `${value}`}
                  />

                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "revenue")
                        return [`$${value.toFixed(2)}`, "Revenue"];
                      if (name === "orders") return [value, "Orders"];
                      return value;
                    }}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    name="Revenue"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#82ca9d"
                    activeDot={{ r: 8 }}
                    name="Orders"
                    strokeWidth={2}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <BarChart2 className="w-16 h-16 mb-4" />
                <p>No sales data available for the last 12 months.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card className="shadow-md col-span-1 w-full">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center capitalize">
              <Package className="h-5 w-5 mr-2" /> Top Selling Products this
              month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topSellingProducts.length > 0 ? (
              <div className="space-y-4">
                {topSellingProducts.map((product) => (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-1 flex-1">
                      <Image
                        src={product.productImage || "/placeholder.png"}
                        alt={product.productName}
                        width={40}
                        height={40}
                        className="rounded-md"
                      />
                      <span className="font-medium line-clamp-1">
                        {product.productName}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {product.totalSoldQuantity} sold
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <BarChart2 className="w-16 h-16 mx-auto mb-4" />
                <p>
                  No sales data available for{" "}
                  <span className="font-semibold">top selling products</span> in
                  the .
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <div className="p-6 rounded-lg shadow-md overflow-x-auto space-y-2">
        <h3 className="text-xl font-semibold mb-4">Recent Orders</h3>
        <hr className="border-gray-500" />
        {orders.length === 0 ? (
          <div className="text-center py-10">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg">No orders found matching your criteria.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 10).map((order: OrderWithRelations) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    {order.buyer?.name || order.buyer?.email || "Guest"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(order.status)}
                      // className="w-full text-center flex justify-center items-center"
                    >
                      {getStatusDisplayName(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>${order.total.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <HoverPrefetchLink
                      href={`/your/store/dashboard/orders/${order.id}`}
                    >
                      <Button variant="outline" size="sm" className="mr-2">
                        <Eye className="h-4 w-4" /> View
                      </Button>
                    </HoverPrefetchLink>
                    {/* Add Update Status button/modal here later */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      {/* Recent Activity Section */}
      {/* <div className="bg-white p-6 rounded-lg shadow-md">
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
      </div> */}
    </div>
  );
}
