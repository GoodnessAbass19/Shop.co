"use client";

import { formatCurrencyValue } from "@/utils/format-currency-value";
import Link from "next/link";
import React from "react";
import CheckoutList from "./CheckoutList";
import CartItem from "./CartItem";
import CartEmpty from "./CartEmpty";
import { useCartStore } from "@/store/cart-store";

const CartBody = () => {
  const totalPrice = useCartStore((state) => state.totalPrice);

  const items = useCartStore((state) => state.items);

  if (items.length === 0) {
    return <CartEmpty />;
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row justify-between gap-10 md:gap-4">
        {/* ----Cart---- */}
        <div className="grow h-full border">
          {items?.map((item) => (
            <div key={item.slug} className="border-b p-4 md:p-6">
              <CartItem
                id={item.id}
                name={item.name}
                price={item.price}
                quantity={item.quantity}
                image={item.image}
                color={item.color}
                size={item.size}
              />
            </div>
          ))}
        </div>

        {/* ----Checkout---- */}
        <div className="lg:sticky md:top-[100px] rounded h-fit min-w-full sm:min-w-[400px] max-w-[500px] overflow-hidden border border-primary-gray/20 ">
          <div className="bg-primary-gray/10 px-4 py-3 ">
            <h3 className="text-lg md:text-xl font-semibold">Cart Total</h3>
          </div>

          <div className="p-4 mt-6">
            <CheckoutList
              title="Sub Total"
              value={formatCurrencyValue(totalPrice)}
            />
            <hr className="border-primary-gray/20 mt-4 mb-6" />

            <CheckoutList title="Delivery Cost" value="TBD" />
            <hr className="border-primary-gray/20 mt-4 mb-6" />

            <CheckoutList title="Discount" value="0%" />
            <hr className="border-primary-gray/20 mt-4 mb-6" />

            <CheckoutList
              title="TOTAL"
              value={formatCurrencyValue(totalPrice)}
            />
          </div>

          <div className="mt-4 mb-6 px-4 space-y-4">
            <button
              className="flex items-center justify-center w-full h-10 text-sm text-white bg-black border border-black rounded trans-150"
              onClick={
                // share via whatsapp
                () => {
                  const url = `https://wa.me/2347056204488?text=${encodeURIComponent(
                    `I would like to order these items:\n${items
                      .map((item) => `${item?.name} x ${item?.quantity}`)
                      .join(", ")}.\nTotal: ${formatCurrencyValue(totalPrice)}`
                  )}`;
                  window.open(url, "_blank");
                }
              }
            >
              Order now
            </button>

            <button
              className="flex items-center justify-center w-full h-10 text-sm text-black hover:text-white hover:bg-black border border-black rounded trans-150"
              onClick={() =>
                useCartStore.setState({
                  items: [],
                  totalPrice: 0,
                  totalItems: 0,
                })
              }
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 ml-5">
        <Link
          className="flex items-center justify-center w-full max-w-[170px] md:min-w-[157px] h-10 text-sm text-black hover:text-white hover:bg-black border border-black rounded trans-150"
          href={"/"}
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default CartBody;
