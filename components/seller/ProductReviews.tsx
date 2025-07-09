// components/seller/ProductReviews.tsx
import React from "react";
import { Star, MessageSquare } from "lucide-react";
import { Button } from "../ui/button";

export function ProductReviews() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Product Reviews</h2>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Star className="h-5 w-5 mr-2 text-yellow-500" /> Recent Reviews
        </h3>
        <p className="text-gray-700">
          View customer reviews for your products and respond to them.
        </p>
        <ul className="mt-4 space-y-3 text-gray-700">
          <li className="p-3 border rounded-md">
            <div className="flex items-center mb-1">
              <span className="font-semibold mr-2">
                Product: Awesome Gadget
              </span>
              <span className="text-yellow-500 flex items-center">
                <Star className="h-4 w-4 fill-current mr-1" /> 5.0
              </span>
            </div>
            <p className="text-sm italic mb-2">
              "Love this product! Fast shipping and great quality." - Customer A
            </p>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <MessageSquare className="h-4 w-4" /> Reply
            </Button>
          </li>
          <li className="p-3 border rounded-md">
            <div className="flex items-center mb-1">
              <span className="font-semibold mr-2">Product: Cozy Blanket</span>
              <span className="text-yellow-500 flex items-center">
                <Star className="h-4 w-4 fill-current mr-1" /> 4.0
              </span>
            </div>
            <p className="text-sm italic mb-2">
              "Good blanket, but a bit thinner than expected." - Customer B
            </p>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <MessageSquare className="h-4 w-4" /> Reply
            </Button>
          </li>
        </ul>
      </div>
    </div>
  );
}
