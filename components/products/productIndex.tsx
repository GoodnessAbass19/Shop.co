// components/products/ProductGrid.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Category,
  Product,
  ProductVariant,
  SubCategory,
  SubSubCategory,
  Store,
  Discount, // Import Discount type
} from "@prisma/client";
import { Loader2, Package, XCircle, ShoppingBag } from "lucide-react"; // Icons for loading, empty, error states
import ProductCard from "./productCard";

// --- Import the user's ProductCard component ---

// --- Type Definitions (Extend Prisma models for API response) ---
// This type reflects the data structure coming *out* of your /api/products endpoint
// before it's transformed for the ProductCard.
type ProductFromApi = Product & {
  category: Pick<Category, "id" | "name" | "slug">;
  subCategory: Pick<SubCategory, "id" | "name" | "slug">;
  subSubCategory: Pick<SubSubCategory, "id" | "name" | "slug"> | null;
  variants: Pick<ProductVariant, "id" | "price" | "size" | "color" | "stock">[];
  store: Pick<Store, "id" | "name" | "slug">;
  discounts: Discount[]; // Include discounts
  // These are added by the API route's mapping:
  productName: string;
  lowestPrice: number; // The lowest base price (from variants or product)
  discountedPrice: number | null; // The price after discount
  images: { url: string }[]; // Transformed image array
};

// --- ProductGrid Component (Main component to fetch and display products) ---
interface ProductGridProps {
  title?: string; // Custom title for the section
  // Optional filters (can be expanded later if needed for specific category pages)
  categoryId?: string;
  subCategoryId?: string;
  subSubCategoryId?: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  title = "All Products", // Default title
  categoryId,
  subCategoryId,
  subSubCategoryId,
}) => {
  const [products, setProducts] = useState<ProductFromApi[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null); // Clear previous errors
      try {
        const queryParams = new URLSearchParams();
        if (categoryId) queryParams.append("categoryId", categoryId);
        if (subCategoryId) queryParams.append("subCategoryId", subCategoryId);
        if (subSubCategoryId)
          queryParams.append("subSubCategoryId", subSubCategoryId);
        // ?${queryParams.toString()}

        const res = await fetch(`/api/products`);
        const data = await res.json();

        if (res.ok) {
          // The API now returns products in the desired format for ProductCard
          setProducts(data.products);
        } else {
          setError(data.error || "Failed to fetch products.");
          console.error("Failed to fetch products:", res.status, data);
        }
      } catch (err) {
        console.error("Network or parsing error fetching products:", err);
        setError("Network error: Could not connect to the server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, subCategoryId, subSubCategoryId]); // Re-fetch when filter props change

  // --- Render Loading State ---
  //   if (isLoading) {
  //     return (
  //       <section className="max-w-screen-xl mx-auto py-10 px-4 md:px-6 lg:px-8 min-h-[500px] flex items-center justify-center bg-white">
  //         <div className="flex flex-col items-center gap-4 text-gray-700">
  //           <Loader2 className="w-16 h-16 animate-spin text-gray-800" />
  //           <p className="text-xl font-medium">Loading products...</p>
  //         </div>
  //       </section>
  //     );
  //   }

  // --- Render Error State ---
  //   if (error) {
  //     return (
  //       <section className="max-w-screen-xl mx-auto py-10 px-4 md:px-6 lg:px-8 min-h-[500px] flex items-center justify-center bg-red-50">
  //         <div className="p-8 border border-red-300 rounded-lg bg-red-100 text-red-800 text-center shadow-md">
  //           <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
  //           <p className="text-xl font-semibold mb-3">Error loading products:</p>
  //           <p className="mb-4">{error}</p>
  //           <button
  //             onClick={() => window.location.reload()} // Simple reload to retry
  //             className="px-6 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition"
  //           >
  //             Retry Loading Products
  //           </button>
  //         </div>
  //       </section>
  //     );
  //   }

  // --- Render Empty State ---
  //   if (!products || products.length === 0) {
  //     return (
  //       <section className="max-w-screen-xl mx-auto py-10 px-4 md:px-6 lg:px-8 min-h-[500px] flex items-center justify-center bg-white">
  //         <div className="p-8 text-center max-w-md">
  //           <ShoppingBag
  //             className="w-20 h-20 text-gray-400 mx-auto mb-6"
  //             strokeWidth={1.5}
  //           />
  //           <h2 className="text-3xl font-bold text-gray-800 mb-3">
  //             No Products Found!
  //           </h2>
  //           <p className="text-lg text-gray-600 mb-6">
  //             It looks like there are no products available based on your
  //             selection.
  //           </p>
  //           <Link
  //             href="/"
  //             className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition duration-300 transform hover:scale-105 shadow-md"
  //           >
  //             Continue Shopping
  //           </Link>
  //         </div>
  //       </section>
  //     );
  //   }

  // --- Render Products ---
  return (
    <section className="max-w-screen-xl mx-auto py-10 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-10 text-center md:text-left">
          {title}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products?.map((product) => (
            <ProductCard
              key={product.id}
              item={{
                id: product.id,
                slug: product.slug,
                productName: product.productName,
                images: product.images, // Already mapped in API to { url: string }[]
                price: product.price!,
                discountedPrice: product?.discountedPrice,
              }}
              loading={isLoading} // Loading state is handled by ProductGrid now
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
