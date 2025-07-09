// components/seller/DashboardOverview.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming you have shadcn/ui Card components
import { DollarSign, ShoppingBag, Package, Users } from "lucide-react";

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Dashboard Overview
      </h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2350</div>
            <p className="text-xs text-muted-foreground">
              +180.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Products Listed
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">150</div>
            <p className="text-xs text-muted-foreground">+15 new this month</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Customers Reached
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
        <ul className="space-y-3 text-gray-700">
          <li>- New order #12345 from Jane Doe.</li>
          <li>- Product "Vintage Leather Bag" is low on stock (5 left).</li>
          <li>- Payout of $1,200.00 processed.</li>
          <li>- Customer review received for "Handmade Ceramic Mug".</li>
        </ul>
      </div>
    </div>
  );
}
