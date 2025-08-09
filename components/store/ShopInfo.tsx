"use client";

import { useSellerStore } from "@/Hooks/use-store-context";

const ShopInfo = () => {
  const { store } = useSellerStore();
  console.log(store.store.contactEmail);

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">Account details</h2>
          <p className="text-sm text-gray-600">
            Your seller account information.
          </p>
        </div>

        <div></div>
      </div>
    </div>
  );
};

export default ShopInfo;
