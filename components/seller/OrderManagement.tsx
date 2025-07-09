// components/seller/OrderManagement.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { ListOrdered, Eye } from "lucide-react";

export function OrderManagement() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Order Management
      </h2>

      <div className="flex space-x-4 mb-6">
        <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white">
          <ListOrdered className="h-5 w-5" /> View New Orders
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5" /> View All Orders
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Recent Orders</h3>
        <p className="text-gray-700">
          This section will display a list of your recent orders, their status,
          and quick actions for fulfillment.
        </p>
        <ul className="mt-4 space-y-2 text-gray-700">
          <li className="flex items-center justify-between p-3 border rounded-md">
            <span>Order #1001 - Pending (Customer: John Doe)</span>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </li>
          <li className="flex items-center justify-between p-3 border rounded-md">
            <span>Order #1000 - Shipped (Customer: Jane Smith)</span>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </li>
        </ul>
      </div>
    </div>
  );
}
