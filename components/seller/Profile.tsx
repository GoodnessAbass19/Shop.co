"use client";

import { useSellerStore } from "@/Hooks/use-store-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  CircleEllipsis,
  CreditCard,
  ShoppingBag,
  TrendingUp,
  Truck,
} from "lucide-react";
import {
  CheckBadgeIcon,
  CheckCircleIcon,
  EllipsisHorizontalCircleIcon,
} from "@heroicons/react/24/solid";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import ShopInfo from "../store/ShopInfo";
import BusinessInfo from "../store/BusinessInfo";
import ShippingInfo from "../store/ShippingInfo";

const StoreProfile = () => {
  const { store } = useSellerStore();

  return (
    <div className="space-y-8 p-4">
      <Tabs
        defaultValue="shop-information"
        className="max-w-screen-2xl mx-auto w-full space-y-10"
      >
        <Card className="shadow-lg rounded-lg">
          <CardHeader className="space-y-1 capitalize">
            <CardTitle className="font-semibold text-2xl">
              Profile Details
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Complete all the sections below to take your shop live.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-full">
            <TabsList className="max-w-screen-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-between items-center w-full h-full">
              <TabsTrigger
                value="shop-information"
                className="data-[state=active]:text-black data-[state=active]:bg-[#CFECFF] data-[state=active]:border border-[#CFECFF] bg-gray-100 p-3 rounded-xl space-y-4 col-span-1 flex flex-col justify-between items-start shadow-md"
              >
                <div className="flex items-start justify-between w-full">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      Shop Information
                    </h3>
                    <span className="text-xs text-black flex items-center mt-2 gap-2">
                      <CheckCircleIcon className="w-6 h-6 text-blue-500" />
                      COMPLETED
                    </span>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <ShoppingBag className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="business-information"
                className="data-[state=active]:text-black data-[state=active]:bg-[#CFECFF] data-[state=active]:border border-[#CFECFF] bg-gray-100 p-3 rounded-xl  space-y-4 col-span-1 flex flex-col justify-between items-start shadow-md"
              >
                <div className="flex items-start justify-between w-full">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      Business Information
                    </h3>
                    <span className="text-xs text-black flex items-center mt-2 gap-2">
                      {store.businessInfo?.isComplete ? (
                        <CheckCircleIcon className="w-6 h-6 text-blue-500" />
                      ) : (
                        <EllipsisHorizontalCircleIcon className="w-6 h-6 text-gray-500" />
                      )}

                      {store.businessInfo?.isComplete ? "COMPLETED" : "PENDING"}
                    </span>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="shipping-information"
                className="data-[state=active]:text-black data-[state=active]:bg-[#CFECFF] data-[state=active]:border border-[#CFECFF] bg-gray-100 p-3 rounded-xl  space-y-4 col-span-1 flex flex-col justify-between items-start shadow-md"
              >
                <div className="flex items-start justify-between w-full">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      Shipping Information
                    </h3>
                    <span className="text-xs text-black flex items-center mt-2 gap-2">
                      {store.shippingInfo?.isComplete ? (
                        <CheckCircleIcon className="w-6 h-6 text-blue-500" />
                      ) : (
                        <EllipsisHorizontalCircleIcon className="w-6 h-6 text-gray-500" />
                      )}

                      {store.shippingInfo?.isComplete ? "COMPLETED" : "PENDING"}
                    </span>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Truck className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="payment-information"
                className="data-[state=active]:text-black data-[state=active]:bg-[#CFECFF] data-[state=active]:border border-[#CFECFF] bg-gray-100 p-3 rounded-xl  space-y-4 col-span-1 flex flex-col justify-between items-start shadow-md"
              >
                <div className="flex items-start justify-between w-full">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      Payment Information
                    </h3>
                    <span className="text-xs text-black flex items-center mt-2 gap-2">
                      <CheckCircleIcon className="w-6 h-6 text-blue-500" />
                      COMPLETED
                    </span>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        <TabsContent
          value="shop-information"
          className="p-4 rounded-lg shadow-lg"
        >
          <ShopInfo />
        </TabsContent>
        <TabsContent
          value="business-information"
          className="p-4 rounded-lg shadow-lg"
        >
          <BusinessInfo />
        </TabsContent>
        <TabsContent
          value="shipping-information"
          className="p-4 rounded-lg shadow-lg"
        >
          <ShippingInfo />
        </TabsContent>
        <TabsContent value="payment-information">
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Payment Information</h2>
            <p>
              Manage your payment methods, including bank details and payment
              gateways.
            </p>
            {/* Additional content can be added here */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StoreProfile;
