// components/seller/SellerStoreContext.tsx
"use client";

import React, { createContext, useContext, ReactNode } from "react";
import {
  Product,
  ProductVariant,
  Category,
  SubCategory,
  SubSubCategory,
  OrderItem,
  Order,
  User,
  Address,
} from "@prisma/client";

// Define the structure of the SellerStore data
interface SellerStoreData {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  banners: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  products: (Product & {
    variants: ProductVariant[];
    category: Category;
    subCategory: SubCategory | null;
    subSubCategory: SubSubCategory | null;
  })[];
  orderItems: (OrderItem & {
    order: Order & {
      buyer: User;
      address: Address;
    };
  })[];
}

// Define the context value type
interface SellerStoreContextType {
  store: SellerStoreData;
}

// Create the context
const SellerStoreContext = createContext<SellerStoreContextType | undefined>(
  undefined
);

// Create a provider component
interface SellerStoreProviderProps {
  children: ReactNode;
  store: SellerStoreData;
}

export function SellerStoreProvider({
  children,
  store,
}: SellerStoreProviderProps) {
  return (
    <SellerStoreContext.Provider value={{ store }}>
      {children}
    </SellerStoreContext.Provider>
  );
}

// Custom hook to use the SellerStoreContext
export function useSellerStore() {
  const context = useContext(SellerStoreContext);
  if (context === undefined) {
    throw new Error("useSellerStore must be used within a SellerStoreProvider");
  }
  return context;
}
