// components/seller/SalesAnalytics.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  LineChart,
  BarChart2,
  TrendingUp,
  Package,
  DollarSign,
  ShoppingBag,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart as RechartsBarChart,
  Bar,
} from "recharts";
import Image from "next/image";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSellerStore } from "@/Hooks/use-store-context";

// Define the shape of the data expected from the API
interface SalesAnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  salesChartData: Array<{
    name: string; // e.g., "Jan 23"
    revenue: number;
    orders: number;
  }>;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    productSlug: string;
    productImage: string | null;
    totalSoldQuantity: number;
    variantName: string;
  }>;
}

// Define the minimal structure of the store prop needed by this component
interface SalesAnalyticsProps {
  store: {
    id: string;
    name: string;
  };
}

// Function to fetch sales analytics data
const fetchSalesAnalytics = async (
  storeId: string
): Promise<SalesAnalyticsData> => {
  const res = await fetch(`/api/store/sales-analytics?storeId=${storeId}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch sales analytics data.");
  }
  return res.json();
};

export function SalesAnalytics() {
  const { store } = useSellerStore();

  const { data, isLoading, isError, error } = useQuery<
    SalesAnalyticsData,
    Error
  >({
    queryKey: ["salesAnalytics", store?.id],
    queryFn: () => fetchSalesAnalytics(store?.id),
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!store?.id,
  });

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
        Error loading sales analytics:{" "}
        {error?.message || "An unknown error occurred."}
        <p className="text-sm mt-2">Please try refreshing the page.</p>
      </div>
    );
  }

  const { totalRevenue, totalOrders, salesChartData, topSellingProducts } =
    data || {
      totalRevenue: 0,
      totalOrders: 0,
      salesChartData: [],
      topSellingProducts: [],
    };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Sales & Analytics for {store.name}
      </h2>

      {/* Overall Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue (All Time)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From all sales</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Orders (All Time)
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              All completed orders
            </p>
          </CardContent>
        </Card>
        {/* You can add more cards here for Monthly Revenue/Orders if desired, or get them from DashboardSummary */}
      </div>

      {/* Sales Trend Chart */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <LineChart className="h-5 w-5 mr-2" /> Monthly Sales & Orders (Last
            12 Months)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-96 w-full">
          {salesChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={salesChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Package className="h-5 w-5 mr-2" /> Top 5 Selling Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topSellingProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead className="text-right">Quantity Sold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSellingProducts.map((product) => (
                  <TableRow key={product.productId}>
                    <TableCell>
                      <Link href={`/products/${product.productSlug}`}>
                        {product.productImage ? (
                          <Image
                            src={product.productImage}
                            alt={product.productName}
                            width={60}
                            height={60}
                            className="rounded-md object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://placehold.co/60x60/e0e0e0/555555?text=No+Img";
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
                            No Img
                          </div>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/products/${product.productSlug}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {product.productName}
                      </Link>
                    </TableCell>
                    <TableCell>{product.variantName}</TableCell>
                    <TableCell className="text-right font-bold">
                      {product.totalSoldQuantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <BarChart2 className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">No top selling products data available.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
