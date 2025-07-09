// components/seller/StoreSettings.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Store, Truck, CreditCard, Bell } from "lucide-react";

export function StoreSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Store Settings</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Store className="h-5 w-5 mr-2 text-blue-600" /> Store Profile
          </h3>
          <p className="text-gray-700">
            Update your store's name, description, logo, and banner images.
          </p>
          <Button variant="outline" className="mt-4">
            Edit Profile
          </Button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Truck className="h-5 w-5 mr-2 text-green-600" /> Shipping Settings
          </h3>
          <p className="text-gray-700">
            Configure your shipping methods, rates, and delivery regions.
          </p>
          <Button variant="outline" className="mt-4">
            Manage Shipping
          </Button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-purple-600" /> Payment
            Settings
          </h3>
          <p className="text-gray-700">
            Manage your payout methods and view payment history.
          </p>
          <Button variant="outline" className="mt-4">
            Manage Payments
          </Button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-orange-600" /> Notification
            Preferences
          </h3>
          <p className="text-gray-700">
            Customize how you receive alerts and updates from the platform.
          </p>
          <Button variant="outline" className="mt-4">
            Configure Notifications
          </Button>
        </div>
      </div>
    </div>
  );
}
