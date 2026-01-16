"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { isSaleActive } from "@/lib/utils";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import {
  Cart,
  CartItem,
  Discount,
  Product,
  ProductVariant,
  Store,
} from "@prisma/client";
import { Arrow } from "@radix-ui/react-dropdown-menu";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, StoreIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

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

const CheckoutPage = () => {
  const router = useRouter();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );

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

  return (
    <div className="space-y-7 max-w-screen-xl mx-auto px-4 py-3 font-sans">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="cursor-pointer flex items-center gap-2 font-bold"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </div>

        <Separator orientation="vertical" className="h-6" />

        <Breadcrumb className="hidden md:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/cart">Cart</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="dark:text-white text-black capitalize text-xs md:text-sm font-normal font-sans truncate text w-[200px]">
                Checkout
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xl md:text-2xl lg:text-3xl tracking-tight font-bold text-[#121714]">
          Checkout
        </h3>
        <p className="text-[#638370]">Complete your purchase below</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full space-y-6">
          {/* Address Selection Component */}
          <div className="border border-gray-100 rounded-xl p-6 shadow-sm sm:p-8 space-y-4">
            <h4 className="text-lg font-semibold">Select Delivery Address</h4>
            <Separator className="bg-gray-300" />
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
                <Link href="/me/account/" className="text-blue-600 underline">
                  Add one
                </Link>
              </p>
            )}
          </div>

          {/* Checkout Summary Component */}
          <div className="border border-gray-100 rounded-xl p-3 shadow-sm sm:p-5 space-y-4">
            <div className="flex items-center border-b border-gray-100">
              <h3 className="text-lg font-semibold">Order Summary</h3>

              <div className="ml-auto text-sm text-gray-500">
                {cart?.cartItems.length || 0} items
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {cart?.cartItems.map((item) => {
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
                    className="rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
                  >
                    <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <StoreIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                          Sold by:{" "}
                          <Link
                            href={`/store/${item.productVariant.product.store.slug}`}
                          >
                            {item.productVariant.product.store.name}
                          </Link>
                        </h2>
                      </div>
                      <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                        Free Shipping
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 px-2.5 py-5">
                      <div className="shrink-0">
                        <div
                          className="size-24 rounded-lg bg-slate-100 dark:bg-slate-800 bg-cover bg-center border border-slate-200 dark:border-slate-700"
                          data-alt={`Image for ${product.name}`}
                          style={{ backgroundImage: `url(${imageUrl})` }}
                        />
                      </div>

                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-tight mb-1 line-clamp-3">
                              {product.name}
                            </h3>
                            {item.colorSelected && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                Color: {item.colorSelected}
                              </p>
                            )}
                          </div>
                          <p className="text-base font-bold text-slate-900 dark:text-white">
                            {formatCurrencyValue(item.quantity * currentPrice!)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-24">
          <div className="rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Order Summary
            </h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Subtotal ({cart?.cartItems.length})</span>
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
            <div className="mb-6">
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
            </div>
            <Button
              onClick={handleProceedToCheckout}
              disabled={
                !cart ||
                cart.cartItems.length === 0 ||
                !selectedAddressId ||
                createCheckoutSessionMutation.isPending
              }
              className="w-full rounded-lg bg-primary py-3.5 text-center text-sm font-bold text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            >
              {createCheckoutSessionMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" /> Initiating
                  Checkout...
                </>
              ) : (
                " Confirm Order & Proceed to Payment "
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
