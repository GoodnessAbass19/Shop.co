// components/seller/ProductManagement.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, List, Edit } from "lucide-react";

export function ProductManagement() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Product Management
      </h2>

      <div className="flex space-x-4 mb-6">
        <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="h-5 w-5" /> Add New Product
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <List className="h-5 w-5" /> View All Products
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">
          Your Products (List View)
        </h3>
        <p className="text-gray-700">
          Here you would see a table or grid of your products with options to
          edit, view details, or manage stock.
        </p>
        <ul className="mt-4 space-y-2 text-gray-700">
          <li className="flex items-center justify-between p-3 border rounded-md">
            <span>Product A - $25.00 (Stock: 10)</span>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </li>
          <li className="flex items-center justify-between p-3 border rounded-md">
            <span>Product B - $50.00 (Stock: 5)</span>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </li>
        </ul>
      </div>
    </div>
  );
}
