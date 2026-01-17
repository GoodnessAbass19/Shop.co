// app/cart/page.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  Cart,
  CartItem,
  Product,
  ProductVariant,
  Discount,
  Store,
} from "@prisma/client";
import { Loader2, Plus, Minus, Trash2Icon, StoreIcon } from "lucide-react"; // Icons for empty state, loading, remove item
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui Button
import EmptyCartIcon from "@/components/ui/EmptyCartIcon";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { HoverPrefetchLink } from "@/lib/HoverLink";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { isSaleActive } from "@/lib/utils";
import WishlistButton from "@/components/ui/wishlistButton";
import { useUser } from "@/hooks/user-context";

// --- Extended Types to match API response ---
type ProductWithDiscounts = Product & { discounts: Discount[]; store: Store };
type ProductVariantInCartItem = ProductVariant & {
  product: ProductWithDiscounts;
};
type CartItemWithDetails = CartItem & {
  productVariant: ProductVariantInCartItem;
  calculatedItemDiscount: number; // Added from backend
};
type CartWithItems = Cart & { cartItems: CartItemWithDetails[] };

const CartPage = () => {
  const { refetchCart } = useUser();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false); // For showing loading on quantity update
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );

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

  const {
    data: addresses,
    isLoading: isLoadingAddresses,
    isError: isAddressError,
  } = useQuery({
    queryKey: ["userAddresses"],
    queryFn: async () => {
      const res = await fetch("/api/me/address");
      if (!res.ok) throw new Error("Failed to fetch addresses");
      return res.json();
    },
    enabled: !!cart, // only fetch if cart is available
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
      refetchCart();
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
        body: JSON.stringify({ addressId: selectedAddressId }), // 👈 send address
        // No body needed here, as the backend fetches the cart from the user's session
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to initiate checkout.");
      }
      return res.json();
    },
    onSuccess: (data: { reference: string; authorizationUrl: string }) => {
      // Redirect user to Stripe Checkout page
      if (data.authorizationUrl) {
        router.push(data.authorizationUrl);
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
      if (!selectedAddressId) {
        alert("Please select a delivery address before proceeding.");
        return;
      }
      return;
    }
    createCheckoutSessionMutation.mutate();
  }, [cart, createCheckoutSessionMutation]);

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
      refetchCart();
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

  // Group cart items by storeId for vendor-separated rendering
  const groupedByStore = useMemo(() => {
    if (!cart || !cart.cartItems)
      return [] as { store: Store; items: CartItemWithDetails[] }[];
    const map = new Map<
      string,
      { store: Store; items: CartItemWithDetails[] }
    >();
    cart.cartItems.forEach((it) => {
      const store = it.productVariant.product.store as Store;
      const sid = store?.id || "unknown";
      if (!map.has(sid)) map.set(sid, { store, items: [] });
      map.get(sid)!.items.push(it as CartItemWithDetails);
    });
    return Array.from(map.values());
  }, [cart]);

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
            <HoverPrefetchLink
              className="flex items-center justify-center w-full max-w-[170px] md:min-w-[157px] h-10 text-sm bg-black text-white dark:bg-white dark:text-black rounded trans-150"
              href={"/"}
            >
              Continue Shopping
            </HoverPrefetchLink>
          </div>
        </div>
      </section>
    );
  }

  // Render Cart Content
  return (
    <div className="space-y-7 max-w-screen-xl mx-auto px-4 py-3 font-sans">
      <Breadcrumb className="hidden md:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="dark:text-white text-black capitalize text-xs md:text-sm font-normal font-sans truncate text w-[200px]">
              cart
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Shopping Cart ({cart.cartItems.length} items)
        </h1>
        <Link
          className="text-sm font-medium text-primary hover:underline"
          href="/"
        >
          Continue Shopping
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full space-y-6">
          {groupedByStore.map((group) => (
            <div
              key={group.store.id}
              className="rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <StoreIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Sold by:{" "}
                    <Link href={`/store/${group.store.slug}`}>
                      {group.store.name}
                    </Link>
                  </h2>
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                  Free Shipping
                </span>
              </div>

              {group.items.map((item) => {
                const product = item.productVariant.product;
                const variant = item.productVariant;
                const isOnSale =
                  variant &&
                  isSaleActive(variant.saleStartDate, variant.saleEndDate);
                const currentPrice = isOnSale
                  ? variant.salePrice
                  : variant?.price;
                const imageUrl =
                  product.images?.[0] ||
                  "https://placehold.co/100x100/e2e8f0/64748b?text=No+Image";

                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row gap-4 px-6 py-6 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <div className="shrink-0">
                      <div
                        className="size-24 rounded-lg bg-slate-100 dark:bg-slate-800 bg-cover bg-center border border-slate-200 dark:border-slate-700"
                        data-alt={`Image for ${product.name}`}
                        style={{ backgroundImage: `url(${imageUrl})` }}
                      />
                    </div>

                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between items-start gap-4">
                        <Link href={`/products/${product.slug}`}>
                          <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white leading-tight mb-1 line-clamp-2">
                            {product.name}
                          </h3>
                          {item.colorSelected && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                              Color: {item.colorSelected}
                            </p>
                          )}
                        </Link>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          {formatCurrencyValue(item.quantity * currentPrice!)}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <button
                              className="flex size-8 items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-l-lg transition-colors disabled:opacity-50"
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1 || isUpdating}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center mx-2 text-lg font-medium">
                              {item.quantity}
                            </span>
                            <button
                              className="flex size-8 items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-l-lg transition-colors disabled:opacity-50"
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity + 1)
                              }
                              disabled={
                                item.quantity >= variant.quantity || isUpdating
                              }
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            className="text-sm font-medium text-slate-500 hover:text-primary transition-colors flex items-center gap-1"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isUpdating}
                          >
                            <Trash2Icon className="text-[18px]" />
                            <span className="hidden sm:inline">Remove</span>
                          </button>

                          <WishlistButton
                            className="text-sm font-medium text-slate-500 hover:text-primary transition-colors flex items-center gap-1 ml-2"
                            productId={product.id}
                            name={product.name}
                          >
                            <span className="hidden sm:inline">
                              Save for later
                            </span>
                          </WishlistButton>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-24">
          <div className="rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Order Summary
            </h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Subtotal ({cart.cartItems.length})</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatCurrencyValue(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Shipping estimate</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  $5.99
                </span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Tax estimate</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  $32.00
                </span>
              </div>
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Discount</span>
                <span>-$0.00</span>
              </div>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  Order Total
                </span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrencyValue(finalTotal + 5.99 + 32.0)}
                </span>
              </div>
            </div>
            {/* <!-- Promo Code --> */}
            {/* <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Promo Code
              </label>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:border-primary focus:ring-primary dark:text-white"
                  placeholder="Enter code"
                  type="text"
                />
                <button className="rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  Apply
                </button>
              </div>
            </div> */}
            <button
              onClick={() => router.push("/checkout")}
              className="w-full rounded-lg bg-primary py-3.5 text-center text-sm font-bold text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            >
              Proceed to Checkout
            </button>
            {/* <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <span className="material-symbols-outlined text-[16px]">
                lock
              </span>
              <span>Secure Checkout</span>
            </div> */}
          </div>
        </div>
      </div>

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
                <HoverPrefetchLink
                  href={`/products/${product.slug}`}
                  className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 rounded-md overflow-hidden border border-gray-200"
                >
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                  />
                </HoverPrefetchLink>

                {/* Item Details */}
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 w-full">
                  <div>
                    <HoverPrefetchLink
                      href={`/products/${product.slug}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-700 transition-colors line-clamp-2"
                    >
                      {product.name}
                    </HoverPrefetchLink>
                    <p className="text-sm text-gray-600 mt-1">
                      {variant.size && `Size: ${variant.size}`}
                      {variant.sellerSku && ` (SKU: ${variant.sellerSku})`}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Available: {variant.quantity}
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end justify-between text-right">
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrencyValue(item.quantity * variant.price)}
                    </p>
                    {item.calculatedItemDiscount > 0 && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        -{formatCurrencyValue(item.calculatedItemDiscount)}{" "}
                        Discount
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
                        disabled={
                          item.quantity >= variant.quantity || isUpdating
                        }
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
          {/* {(updateQuantityMutation.isPending ||
            deleteCartItemMutation.isPending) && (
            <div className="flex justify-center items-center py-4 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Updating cart...
            </div>
          )} */}
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

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">
              Select Delivery Address
            </h3>

            {isLoadingAddresses ? (
              <p>Loading addresses...</p>
            ) : addresses?.length > 0 ? (
              <div className="space-y-2">
                {addresses.map((address: any) => (
                  <label
                    key={address.id}
                    className={`block p-4 border rounded-md cursor-pointer ${
                      selectedAddressId === address.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={address.id}
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                      className="hidden"
                    />
                    <div className="text-sm">
                      <div>
                        {address.street}, {address.city}, {address.state}
                      </div>
                      <div>
                        {address.country}, {address.postalCode}
                      </div>
                      {address.isDefault && (
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded ml-2">
                          Default
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No saved addresses.{" "}
                <HoverPrefetchLink
                  href="/me/account/"
                  className="text-blue-600 underline"
                >
                  Add one
                </HoverPrefetchLink>
              </p>
            )}
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
            <HoverPrefetchLink
              href="/"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              Continue Shopping
            </HoverPrefetchLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
