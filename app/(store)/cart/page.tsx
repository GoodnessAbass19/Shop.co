// import Cart from "@/components/cart";

// const CartPage = () => {
//   return (
//     <div className="">
//       <Cart />
//     </div>
//   );
// };

// export default CartPage;

// app/cart/page.tsx
// app/cart/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Cart,
  CartItem,
  Product,
  ProductVariant,
  Discount,
} from "@prisma/client";
import {
  ShoppingBag,
  Loader2,
  XCircle,
  ArrowLeft,
  Plus,
  Minus,
  Trash2Icon,
} from "lucide-react"; // Icons for empty state, loading, remove item
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui Button
import EmptyCartIcon from "@/components/ui/EmptyCartIcon";
import useSWR from "swr";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
// import { Input } from "@/components/ui/input"; // No longer directly using Input component for quantity

// --- Extended Types to match API response ---
type ProductWithDiscounts = Product & { discounts: Discount[] };
type ProductVariantInCartItem = ProductVariant & {
  product: ProductWithDiscounts;
};
type CartItemWithDetails = CartItem & {
  productVariant: ProductVariantInCartItem;
  calculatedItemDiscount: number; // Added from backend
};
type CartWithItems = Cart & { cartItems: CartItemWithDetails[] };

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.error || "Failed to fetch cart.");
    error.status = res.status;
    throw error;
  }
  return data;
};

const CartPage = () => {
  const queryClient = useQueryClient();
  // const { data, error, isLoading, mutate } = useSWR("/api/cart", fetcher);
  const [isUpdating, setIsUpdating] = useState(false); // For showing loading on quantity update
  const router = useRouter();
  const {
    data: cart,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<CartWithItems, Error>({
    // Added refetch
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await fetch("/api/cart");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch cart.");
      }
      return res.json().then((data) => data.cart); // Ensure to return the 'cart' object from the response
    },
    staleTime: 0, // Keep data fresh for cart
    refetchOnWindowFocus: true, // Always refetch cart on focus to ensure accuracy
  });

  // --- NEW: useMutation for deleting a cart item ---
  const deleteCartItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/cart/item/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to remove item from cart.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] }); // Invalidate and refetch the cart data
      toast.success("Item removed from cart successfully!");
    },
    onError: (mutationError: Error) => {
      toast.error(`Error removing item`);
    },
  });

  // --- NEW: useMutation for Stripe Checkout ---
  const createCheckoutSessionMutation = useMutation({
    mutationFn: async () => {
      // The backend will fetch the cart, validate, and create the session
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // No body needed here, as the backend fetches the cart from the user's session
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to initiate checkout.");
      }
      return res.json();
    },
    onSuccess: (data: { sessionId: string; url: string }) => {
      // Redirect user to Stripe Checkout page
      if (data.url) {
        router.push(data.url);
      } else {
        alert("Stripe session URL not received.");
      }
    },
    onError: (mutationError: Error) => {
      alert(`Checkout Error: ${mutationError.message}`);
    },
  });

  // --- NEW: handleProceedToCheckout ---
  const handleProceedToCheckout = useCallback(() => {
    if (!cart || cart.cartItems.length === 0) {
      alert(
        "Your cart is empty. Please add items before proceeding to checkout."
      );
      return;
    }
    createCheckoutSessionMutation.mutate();
  }, [cart, createCheckoutSessionMutation]);

  // const fetchCart = useCallback(async () => {
  //   setIsLoading(true);
  //   setError(null);
  //   try {
  //     const res = await fetch("/api/cart");
  //     const data = await res.json();

  //     if (res.ok) {
  //       setCart(data.cart);
  //     } else {
  //       setError(data.error || "Failed to fetch cart.");
  //       console.error("Failed to fetch cart:", res.status, data);
  //     }
  //   } catch (err) {
  //     console.error("Network or parsing error fetching cart:", err);
  //     setError("Network error: Could not connect to the server.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, []);

  // useEffect(() => {
  //   fetchCart();
  // }, [fetchCart]);

  // Handle quantity changes
  // const handleQuantityChange = async (itemId: string, newQuantity: number) => {
  //   if (newQuantity < 1) return; // Prevent quantity from going below 1

  //   // Optimistically update UI
  //   setCart((prevCart) => {
  //     if (!prevCart) return null;
  //     const updatedCartItems = prevCart.cartItems.map((item) =>
  //       item.id === itemId ? { ...item, quantity: newQuantity } : item
  //     );
  //     return { ...prevCart, cartItems: updatedCartItems };
  //   });

  //   setIsUpdating(true); // Indicate update in progress
  //   try {
  //     const res = await fetch(`/api/cart/item/${itemId}`, {
  //       method: "PATCH",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ quantity: newQuantity }),
  //     });

  //     if (!res.ok) {
  //       // If update fails, revert UI and show error
  //       await fetchCart(); // Re-fetch to get correct state from server
  //       const errorData = await res.json();
  //       alert(`Failed to update quantity: ${errorData.error}`);
  //     } else {
  //       // If successful, re-fetch to ensure all calculated values are correct
  //       // (especially important if discount logic is complex on backend)
  //       await fetchCart();
  //     }
  //   } catch (err) {
  //     console.error("Error updating quantity:", err);
  //     alert("Network error: Could not update quantity.");
  //     await fetchCart(); // Re-fetch on network error
  //   } finally {
  //     setIsUpdating(false);
  //   }
  // };

  // Calculate subtotal

  // Handle quantity changes (existing logic)
  const updateQuantityMutation = useMutation({
    mutationFn: async ({
      itemId,
      quantity,
    }: {
      itemId: string;
      quantity: number;
    }) => {
      const res = await fetch(`/api/cart/item/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update quantity.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] }); // Invalidate cart to refetch latest
      toast.success("Item added to cart successfully!");
    },
    onError: (mutationError: Error) => {
      toast.error(`Error updating quantity`);
    },
  });

  const handleQuantityChange = useCallback(
    (itemId: string, newQuantity: number) => {
      if (newQuantity < 0) return; // Prevent negative quantity
      // You might want to prevent zero quantity here too and handle deletion
      // For now, let's keep 0 as a valid intermediate state if you allow it

      updateQuantityMutation.mutate({ itemId, quantity: newQuantity });
    },
    [updateQuantityMutation]
  );

  // --- NEW: handleRemoveItem function ---
  const handleRemoveItem = useCallback(
    (itemId: string) => {
      // if (
      //   confirm("Are you sure you want to remove this item from your cart?")
      // ) {
      // Use browser confirm for simplicity
      deleteCartItemMutation.mutate(itemId);
    },
    // },
    [deleteCartItemMutation]
  );

  // const cart: CartWithItems | null = data?.cart ?? null;

  const subtotal =
    cart?.cartItems.reduce((sum, item) => {
      return sum + item.quantity * item.productVariant.price;
    }, 0) || 0;

  // Total discount amount is now fetched from the API
  const totalDiscountAmount =
    cart?.cartItems.reduce((sum, item) => {
      return sum + item.calculatedItemDiscount;
    }, 0) || 0;

  // Calculate final total after discount
  const finalTotal = subtotal - totalDiscountAmount;
  // Combine pending states for all mutations
  const isAnyMutationPending =
    updateQuantityMutation.isPending ||
    deleteCartItemMutation.isPending ||
    createCheckoutSessionMutation.isPending;

  // Render Loading State
  if (isLoading) {
    return (
      <section className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </section>
    );
  }

  // Render Error State
  // if (error) {
  //   return (
  //     <section className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-red-50">
  //       <div className="p-8 border border-red-300 rounded-lg bg-red-100 text-red-800 text-center shadow-md">
  //         <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
  //         <p className="text-xl font-semibold mb-3">Error loading your cart:</p>
  //         <p className="mb-4">{error.message}</p>
  //         <Button
  //           onClick={() => mutate()}
  //           className="bg-red-700 hover:bg-red-800 text-white"
  //         >
  //           Retry Loading Cart
  //         </Button>
  //       </div>
  //     </section>
  //   );
  // }

  // Render Empty Cart State
  if (!cart || cart.cartItems.length === 0) {
    return (
      <section className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-white">
        <div className="p-8 text-center max-w-md">
          {/* <ShoppingBag
            className="w-20 h-20 text-gray-400 mx-auto mb-6"
            strokeWidth={1.5}
          /> */}
          <EmptyCartIcon />
          <div className="mt-5 w-full flex justify-center">
            <Link
              className="flex items-center justify-center w-full max-w-[170px] md:min-w-[157px] h-10 text-sm bg-black text-white dark:bg-white dark:text-black rounded trans-150"
              href={"/"}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Render Cart Content
  return (
    <section className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center md:text-left">
        Your Shopping Bag
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6 space-y-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 pb-4 border-b border-gray-200">
            Items ({cart.cartItems.length})
          </h2>
          {cart.cartItems.map((item) => {
            const product = item.productVariant.product;
            const variant = item.productVariant;
            const imageUrl =
              product.images?.[0] ||
              "https://placehold.co/100x100/e2e8f0/64748b?text=No+Image";

            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 p-4 border rounded-md shadow-sm bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
              >
                {/* Product Image */}
                <Link
                  href={`/products/${product.slug}`}
                  className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 rounded-md overflow-hidden border border-gray-200"
                >
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                  />
                </Link>

                {/* Item Details */}
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 w-full">
                  <div>
                    <Link
                      href={`/products/${product.slug}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-700 transition-colors line-clamp-2"
                    >
                      {product.name}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">
                      {variant.color && `Color: ${variant.color}`}
                      {variant.size &&
                        (variant.color
                          ? ` / Size: ${variant.size}`
                          : `Size: ${variant.size}`)}
                      {variant.sku && ` (SKU: ${variant.sku})`}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Available: {variant.stock}
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end justify-between text-right">
                    <p className="text-xl font-bold text-gray-900">
                      ${(item.quantity * variant.price).toFixed(2)}
                    </p>
                    {item.calculatedItemDiscount > 0 && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        -${item.calculatedItemDiscount.toFixed(2)} Discount
                      </p>
                    )}
                    <div className="flex items-center justify-center sm:justify-end mt-4 sm:mt-0">
                      {/* Quantity Selector */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 rounded-full"
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1 || isUpdating}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-12 text-center mx-2 text-lg font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 rounded-full"
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= variant.stock || isUpdating}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-4 text-gray-500 hover:text-red-600 transition-colors"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isUpdating} // Disable during update/delete operations
                      >
                        <Trash2Icon className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {(updateQuantityMutation.isPending ||
            deleteCartItemMutation.isPending) && (
            <div className="flex justify-center items-center py-4 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Updating cart...
            </div>
          )}
        </div>

        {/* Order Summary / Total */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-lg p-6 border border-gray-200 h-fit sticky top-20">
          <h2 className="text-2xl font-bold text-gray-800 pb-4 border-b border-gray-200 mb-4">
            Order Summary
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex justify-between text-lg">
              <span>Subtotal ({cart.cartItems.length} items)</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {totalDiscountAmount > 0 && (
              <div className="flex justify-between text-lg text-green-600 font-medium">
                <span>Discount Applied</span>
                <span>-${totalDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg">
              <span>Shipping Estimate</span>
              <span>$0.00</span> {/* Placeholder */}
            </div>
            <div className="flex justify-between text-lg">
              <span>Tax Estimate</span>
              <span>$0.00</span> {/* Placeholder */}
            </div>
            <div className="flex justify-between text-3xl font-bold text-gray-900 pt-4 border-t border-gray-200 mt-4">
              <span>Order Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>
          {/* --- NEW: Proceed to Checkout Button --- */}
          <Button
            className="w-full bg-gray-900 hover:bg-gray-800 text-white text-lg py-3 rounded-md shadow-lg transition-all duration-300 mt-8 transform hover:scale-105"
            onClick={handleProceedToCheckout}
            disabled={
              !cart ||
              cart.cartItems.length === 0 ||
              isAnyMutationPending ||
              createCheckoutSessionMutation.isPending
            }
          >
            {createCheckoutSessionMutation.isPending ? (
              <>
                <Loader2 className="animate-spin mr-2" /> Initiating Checkout...
              </>
            ) : (
              "Proceed to Checkout"
            )}
          </Button>
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CartPage;
