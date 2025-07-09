// components/seller/DiscountManagement.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Tag, PlusCircle } from "lucide-react";

export function DiscountManagement() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Discounts & Promotions
      </h2>

      <div className="flex space-x-4 mb-6">
        <Button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white">
          <PlusCircle className="h-5 w-5" /> Create New Discount
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Tag className="h-5 w-5" /> View All Discounts
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Active Promotions</h3>
        <p className="text-gray-700">
          Manage your active and upcoming discount codes and promotional
          campaigns here.
        </p>
        <ul className="mt-4 space-y-2 text-gray-700">
          <li className="flex items-center justify-between p-3 border rounded-md">
            <span>SUMMER20 - 20% off (Expires: Aug 31)</span>
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          </li>
          <li className="flex items-center justify-between p-3 border rounded-md">
            <span>FREESHIP - Free Shipping (Active)</span>
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          </li>
        </ul>
      </div>
    </div>
  );
}
