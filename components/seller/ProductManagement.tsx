// components/seller/ProductManagement.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusCircle,
  List,
  Edit,
  Trash2,
  Loader2,
  Search,
  XCircle,
  Eye,
  Package,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/Hooks/use-toast";
import {
  Product,
  ProductVariant,
  Category,
  SubCategory,
  SubSubCategory,
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
// import { AddProductForm } from "./AddProductForm"; // Import the new AddProductForm
// import { EditProductForm } from "./EditProductForm"; // Import the new EditProductForm
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog"; // Assuming shadcn/ui Dialog
import { formatCurrencyValue } from "@/utils/format-currency-value";
import { useSellerStore } from "@/Hooks/use-store-context";
import { useRouter } from "next/navigation";
import { HoverPrefetchLink } from "@/lib/HoverLink";

// Extend Product type for data fetching
type ProductWithRelations = Product & {
  variants: ProductVariant[];
  category: Category;
  subCategory: SubCategory | null;
  subSubCategory: SubSubCategory | null;
};

// Function to fetch seller's products for a specific store
const fetchSellerProducts = async (
  storeId: string
): Promise<ProductWithRelations[]> => {
  const res = await fetch(`/api/store/products?storeId=${storeId}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch products.");
  }
  return res.json();
};

// Function to delete a product
const deleteProduct = async (productId: string) => {
  const res = await fetch(`/api/store/products/${productId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to delete product.");
  }
  return res.json();
};

export function ProductManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { store } = useSellerStore(); // Get store data from context
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const {
    data: products,
    isLoading,
    isError,
    error,
  } = useQuery<ProductWithRelations[], Error>({
    queryKey: ["sellerProducts", store.id],
    queryFn: () => fetchSellerProducts(store.id),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!store.id,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast({
        title: "Product Deleted",
        description: "Product has been successfully removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["sellerProducts", store.id] });
      queryClient.invalidateQueries({
        queryKey: ["sellerDashboardSummary", store.id],
      });
    },
    onError: (err: any) => {
      toast({
        title: "Deletion Failed",
        description: err.message || "Could not delete product.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (productId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    ) {
      deleteMutation.mutate(productId);
    }
  };

  const filteredProducts =
    products?.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        product.subCategory?.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        product.subSubCategory?.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    ) || [];

  if (isLoading) {
    return (
      <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-300"></div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <div className="text-red-600 text-center py-8">
        Error loading products: {error?.message || "An unknown error occurred."}
        <p className="text-sm mt-2">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-6">
        Product Management for {store.name}
      </h2>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <Button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => router.push("/your/store/dashboard/products/new")}
        >
          <PlusCircle className="h-5 w-5" /> Add New Product
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <List className="h-5 w-5" /> View Product Categories
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Input
          type="text"
          placeholder="Search products by name or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 border rounded-md w-full focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>

      {/* Products Table */}
      <div className="p-6 rounded-lg shadow-md overflow-x-auto">
        <h3 className="text-xl font-semibold mb-4">
          Your Products ({filteredProducts.length})
        </h3>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg">No products found matching your search.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Product Name</TableHead>
                {/* <TableHead>Category</TableHead> */}
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <HoverPrefetchLink href={`/products/${product.slug}`}>
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={60}
                          height={60}
                          className="rounded-md object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://placehold.co/60x60/e0e0e0/555555?text=No+Img";
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
                          No Img
                        </div>
                      )}
                    </HoverPrefetchLink>
                  </TableCell>
                  <TableCell>
                    <HoverPrefetchLink
                      href={`/products/${product.slug}`}
                      className="font-medium hover:text-blue-600 hover:underline"
                    >
                      {product.name}
                    </HoverPrefetchLink>
                  </TableCell>
                  {/* <TableCell>
                    {product.category.name}
                    {product.subCategory && ` > ${product.subCategory.name}`}
                    {product.subSubCategory &&
                      ` > ${product.subSubCategory.name}`}
                  </TableCell> */}
                  <TableCell>{formatCurrencyValue(product.price)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <HoverPrefetchLink
                      href={`/products/${product.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mr-1"
                        title="View Product"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </HoverPrefetchLink>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mr-1"
                      title="Edit Product"
                      onClick={() =>
                        // setEditingProductId(product.id)
                        router.push(
                          `/your/store/dashboard/products/${product.id}/edit`
                        )
                      }
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      disabled={deleteMutation.isPending}
                      title="Delete Product"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
