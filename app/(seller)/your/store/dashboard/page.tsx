// app/seller/dashboard/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  Store,
  Package,
  PlusCircle,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui button
import { formatCurrencyValue } from "@/utils/format-currency-value";

// Define types for the fetched data (matching your API response)
interface ProductVariant {
  id: string;
  size: string | null;
  color: string | null;
  price: number;
  stock: number;
  sku: string | null;
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

interface SellerProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number; // Base product price
  images: string[];
  stock: number; // Overall product stock
  isFeatured: boolean;
  createdAt: string;
  variants: ProductVariant[];
  category: ProductCategory;
  subCategory: ProductCategory | null;
  subSubCategory: ProductCategory | null;
}

interface SellerStore {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  products: SellerProduct[];
  createdAt: string;
}

const fetchSellerDashboardData = async (): Promise<{ store: SellerStore }> => {
  const res = await fetch("/api/store");
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.error || "Failed to fetch seller dashboard data."
    );
  }
  return res.json();
};

export default function SellerDashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["sellerDashboard"],
    queryFn: fetchSellerDashboardData,
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
  });

  if (isLoading) {
    return (
      <section className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-red-50">
        <XCircle className="w-16 h-16 text-red-500" />
        <p className="text-xl font-medium ml-4">Error: {error?.message}</p>
        <p className="text-md font-medium mt-2">
          Please ensure you have created a store and are logged in as a seller.
        </p>
        {error?.message.includes("No store found") && (
          <Link href="/seller/create-store">
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
              Create Your Store Now
            </Button>
          </Link>
        )}
      </div>
    );
  }

  if (!data) {
    return null; // or a fallback UI if desired
  }
  const { store } = data;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center lg:text-left">
        Seller Dashboard
      </h1>

      {/* Store Information */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 mb-10">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div className="flex items-center gap-4">
            {store.logo && (
              <div className="relative w-20 h-20 flex-shrink-0 rounded-full overflow-hidden border border-gray-200">
                <Image
                  src={store.logo}
                  alt={`${store.name} Logo`}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            )}
            <h2 className="text-3xl font-bold text-gray-900 flex items-center">
              <Store className="h-8 w-8 mr-3 text-gray-700" />
              {store.name}
            </h2>
          </div>
          <Link href={`/shop/${store.slug}`} passHref>
            <Button
              variant="outline"
              className="text-blue-600 hover:text-blue-800 border-blue-600 hover:border-blue-800"
            >
              View My Storefront
            </Button>
          </Link>
        </div>
        <p className="text-gray-700 text-lg">
          {store.description || "No description provided."}
        </p>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <Package className="h-8 w-8 mr-3 text-gray-700" />
            Your Products ({store.products.length})
          </h2>
          <Link href="/seller/products/create" passHref>
            {" "}
            {/* Link to a new product creation page */}
            <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Product
            </Button>
          </Link>
        </div>

        {store.products.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            <p className="text-xl mb-4">You haven't added any products yet.</p>
            <Link href="/seller/products/create" passHref>
              <Button
                variant="outline"
                className="text-blue-600 hover:text-blue-800"
              >
                Start Adding Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {store.products.map((product) => (
              <div
                key={product.id}
                className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 border rounded-md shadow-sm bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 rounded-md overflow-hidden border border-gray-200"
                >
                  <Image
                    src={
                      product.images[0] ||
                      "https://placehold.co/100x100/e2e8f0/64748b?text=No+Image"
                    }
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                  />
                </Link>

                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 w-full">
                  <div>
                    <Link
                      href={`/products/${product.slug}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-700 transition-colors line-clamp-2"
                    >
                      {product.name}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">
                      Category: {product.category?.name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Variants:{" "}
                      {product.variants
                        .map(
                          (v) =>
                            `${v.size || ""}${v.color ? ` ${v.color}` : ""}`
                        )
                        .filter(Boolean)
                        .join(", ") || "None"}
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end justify-between text-right">
                    <p className="text-xl font-bold text-gray-900">
                      {/* ${.toFixed(2)} */}
                      {formatCurrencyValue(product.price)}
                    </p>
                    <p className="text-sm text-gray-700">
                      Stock: {product.stock}
                    </p>
                    <div className="flex items-center justify-center sm:justify-end mt-4 sm:mt-0 gap-2">
                      <Link
                        href={`/seller/products/${product.id}/edit`}
                        passHref
                      >
                        {" "}
                        {/* Link to edit product page */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600 hover:text-red-800"
                      >
                        {" "}
                        {/* Placeholder for delete action */}
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
