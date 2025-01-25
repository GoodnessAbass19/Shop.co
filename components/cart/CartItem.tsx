"use client";

import { useCartStore } from "@/store/cart-store";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import { MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import Image from "next/image";

const CartItem = ({
  id,
  name,
  price,
  quantity,
  image,
  size,
  color,
}: {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  color?: string;
  size?: string;
}) => {
  // Use separate selectors to avoid unnecessary re-renders
  const removeItem = useCartStore((state) => state.removeFromCart);
  const updateItemQuantity = useCartStore((state) => state.updateQuantity);

  return (
    <div className="flex items-start justify-start gap-4">
      <div className="relative">
        <Image
          className="object-cover rounded-lg"
          src={image}
          alt={name}
          // fill
          width={150}
          height={120}
          priority
        />
      </div>
      <div className="flex-1 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="md:text-xl text-lg font-semibold capitalize leading-tight">
            {name}
          </h3>
          <button
            onClick={() => removeItem(id)}
            className="flex gap-2 items-center"
          >
            <TrashIcon className="w-6 h-6 text-red-500" />
          </button>
        </div>
        <div className="flex flex-col justify-start items-start gap-1">
          <p className="font-medium text-base text-start inline-flex gap-2 capitalize">
            size: <span className="font-normal">{size || ""}</span>
          </p>

          <p className="font-medium text-base text-start inline-flex gap-2 capitalize">
            color: <span className="font-normal">{color || null}</span>
          </p>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-black text-base md:text-xl font-bold">
            {formatCurrencyValue(price)}
          </span>
          <div className="flex items-center gap-2 border border-primary h-8 rounded-full bg-[#F0F0F0] w-fit">
            <button
              className="h-full w-fit flex justify-center items-center px-3 bg-primary-gray/10"
              onClick={() => updateItemQuantity(id, "decrease")}
            >
              <MinusIcon className="w-4 h-4 " />
            </button>
            <span className="w-fit px-2">{quantity}</span>
            <button
              className="h-full w-fit flex justify-center items-center px-3 bg-primary-gray/10"
              onClick={() => updateItemQuantity(id, "increase")}
            >
              <PlusIcon className="w-4 h-4 " />
            </button>
          </div>
        </div>
      </div>

      {/* <div className="ml-2 ">
        <button
          onClick={() => removeItem(id)}
          className="flex gap-2 items-center"
        >
          <TrashIcon className="w-6 h-6 text-primary-gray hover:text-primary" />
        </button>
      </div> */}
    </div>
  );
};

export default CartItem;
