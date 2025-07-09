// components/seller/SalesAnalytics.tsx
import React from "react";
import { LineChart, BarChart2, TrendingUp } from "lucide-react";

export function SalesAnalytics() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Sales & Analytics
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <LineChart className="h-5 w-5 mr-2 text-blue-600" /> Revenue Trend
          </h3>
          <p className="text-gray-700">
            A chart showing your revenue over time would be displayed here.
          </p>
          <div className="h-48 bg-gray-50 flex items-center justify-center text-gray-400 rounded-md mt-4">
            [Placeholder for Line Chart]
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <BarChart2 className="h-5 w-5 mr-2 text-green-600" /> Top Selling
            Products
          </h3>
          <p className="text-gray-700">
            A bar chart or list of your best-performing products.
          </p>
          <div className="h-48 bg-gray-50 flex items-center justify-center text-gray-400 rounded-md mt-4">
            [Placeholder for Bar Chart / Product List]
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-purple-600" /> Payouts &
          Earnings
        </h3>
        <p className="text-gray-700">
          Details about your earnings, pending payouts, and payout history.
        </p>
        <ul className="mt-4 space-y-2 text-gray-700">
          <li>- Last Payout: $1,500.00 (June 28, 2025)</li>
          <li>- Pending Balance: $350.00</li>
        </ul>
      </div>
    </div>
  );
}
