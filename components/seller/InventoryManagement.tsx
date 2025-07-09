// components/seller/InventoryManagement.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { List, AlertTriangle } from "lucide-react";

export function InventoryManagement() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Inventory Management
      </h2>

      <div className="flex space-x-4 mb-6">
        <Button className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white">
          <AlertTriangle className="h-5 w-5" /> Low Stock Alerts
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <List className="h-5 w-5" /> All Inventory
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Current Stock Levels</h3>
        <p className="text-gray-700">
          A detailed list of all your products and their current stock
          quantities.
        </p>
        <ul className="mt-4 space-y-2 text-gray-700">
          <li className="flex items-center justify-between p-3 border rounded-md">
            <span>
              Product X - Variant Red (Stock: 3){" "}
              <span className="text-red-500 font-semibold">(Low!)</span>
            </span>
            <Button variant="ghost" size="sm">
              Adjust
            </Button>
          </li>
          <li className="flex items-center justify-between p-3 border rounded-md">
            <span>Product Y - Variant Blue (Stock: 25)</span>
            <Button variant="ghost" size="sm">
              Adjust
            </Button>
          </li>
        </ul>
      </div>
    </div>
  );
}
