// components/seller/SalesAnalytics.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  LineChart, // Keep LineChart icon for general analytics, or replace if desired
  BarChart2, // Used for empty state, can also be used for actual chart if preferred
  TrendingUp, // Not used but kept for context
  Package,
  DollarSign,
  ShoppingBag,
  CalendarIcon,
  LineChartIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSellerStore } from "@/Hooks/use-store-context";
import { format } from "date-fns";
import { DateRange } from "react-day-picker"; // Importing DateRange type from react-day-picker

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils"; // Assuming this is for conditional class names
import { Button } from "../ui/button";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import { HoverPrefetchLink } from "@/lib/HoverLink";

// Define the types for the date range filter options
type FilterType =
  | "TODAY"
  | "THIS_WEEK"
  | "LAST_WEEK"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "CUSTOM";

// Define the options for the date range filter dropdown
export const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  // { label: "Today", value: "TODAY" },
  { label: "This Week", value: "THIS_WEEK" },
  { label: "Last Week", value: "LAST_WEEK" },
  { label: "This Month", value: "THIS_MONTH" },
  { label: "Last Month", value: "LAST_MONTH" },
  { label: "Custom", value: "CUSTOM" },
];

// Define the shape of the data expected from the API
export interface SalesAnalyticsData {
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

// Function to fetch sales analytics with filters
const fetchSalesAnalytics = async (
  storeId: string,
  rangeType: FilterType,
  date?: DateRange // DateRange from react-day-picker
) => {
  const params = new URLSearchParams();
  params.set("storeId", storeId);
  params.set("rangeType", rangeType);

  if (rangeType === "CUSTOM" && date?.from && date?.to) {
    params.set("startDate", date.from.toISOString());
    params.set("endDate", date.to.toISOString());
  }

  const res = await fetch(`/api/store/sales-analytics?${params.toString()}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch sales analytics data.");
  }
  return res.json();
};

export function SalesAnalytics() {
  const { store } = useSellerStore();

  const [range, setRange] = useState<FilterType>("THIS_MONTH");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  // customDate state uses DateRange type from 'react-day-picker'
  const [customDate, setCustomDate] = useState<DateRange | undefined>();

  const isCustomRange = range === "CUSTOM";
  const isValidCustomDate = !!customDate?.from && !!customDate?.to;

  const isQueryEnabled = !!store?.id && (!isCustomRange || isValidCustomDate);

  const { data, isLoading, isError, error } = useQuery<
    SalesAnalyticsData,
    Error
  >({
    queryKey: [
      "salesAnalytics",
      store?.id,
      range,
      customDate?.from?.toISOString(),
      customDate?.to?.toISOString(),
    ],
    queryFn: () => {
      if (!store?.id) throw new Error("Store ID is missing.");
      return fetchSalesAnalytics(store.id, range, customDate);
    },
    enabled: isQueryEnabled,
  });

  if (isLoading) {
    return (
      <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-300"></div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <div className="text-red-600 text-center py-8">
        Error loading sales analytics:{" "}
        {typeof error?.message === "string"
          ? error.message
          : "An unknown error occurred."}
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
    <div className="space-y-8 p-4 md:p-8">
      <h2 className="text-3xl font-bold mb-6">
        Sales & Analytics for {store?.name || "Your Store"}
      </h2>

      {/* Filter Dropdown and Custom Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <Select
            value={range}
            onValueChange={(val) => {
              setRange(val as FilterType);
              // Clear custom date when changing to a non-custom range
              if (val !== "CUSTOM") {
                setCustomDate(undefined);
              }
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {range === "CUSTOM" && (
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button // This Button acts as the trigger for the Popover
                  variant={"outline"}
                  role="combobox"
                  aria-expanded={isPopoverOpen}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !customDate?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDate?.from ? (
                    customDate.to ? (
                      <>
                        {format(customDate.from, "LLL dd, y")} -{" "}
                        {format(customDate.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(customDate.from, "LLL dd, y") + " onwards"
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={customDate?.from}
                  selected={customDate}
                  onSelect={setCustomDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrencyValue(totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">From selected range</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Completed orders</p>
          </CardContent>
        </Card>
        {/* You can add more metric cards here if needed */}
      </div>

      {/* Sales Trend Chart */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <LineChartIcon className="h-5 w-5 mr-2" /> Monthly Sales & Orders (
            {FILTER_OPTIONS.find((f) => f.value === range)?.label ||
              "Selected Range"}
            )
          </CardTitle>
        </CardHeader>
        <CardContent className="h-96 w-full">
          {salesChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={salesChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                barCategoryGap="20%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e0e0e0"
                />
                <XAxis dataKey="name" stroke="#8884d8" fontSize={12} />
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
                  formatter={(
                    value: number | undefined,
                    name: string | undefined
                  ) => {
                    if (value === undefined) return value;
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
                {topSellingProducts.map((product: any) => (
                  <TableRow key={product.productId}>
                    <TableCell>
                      <HoverPrefetchLink
                        href={`/products/${product.productSlug}`}
                      >
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
                      </HoverPrefetchLink>
                    </TableCell>
                    <TableCell>
                      <HoverPrefetchLink
                        href={`/products/${product.productSlug}`}
                        className="font-medium hover:text-blue-600 hover:underline"
                      >
                        {product.productName}
                      </HoverPrefetchLink>
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
              <p>
                No sales data available for{" "}
                {FILTER_OPTIONS.find(
                  (f) => f.value === range
                )?.label?.toLowerCase()}
                .
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
