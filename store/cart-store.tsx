import { CartProduct } from "@/types";
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

// define zustand state and actions
type State = {
  items: CartProduct[];
  totalItems: number;
  totalPrice: number;
};

type Actions = {
  addToCart: (product: CartProduct) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, action: "increase" | "decrease") => void;
  emptyCart: VoidFunction;
};

const initialState: State = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

export const useCartStore = create<State & Actions>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        totalItems: 0,
        totalPrice: 0,
        addToCart: (product: CartProduct) => {
          const index = get().items.findIndex((item) => item.id === product.id);
          if (index !== -1) {
            set((state) => {
              const items = [...state.items];
              items[index].quantity += product.quantity;
              return {
                ...state,
                items,
                totalItems: state.totalItems + product.quantity,
                totalPrice: state.totalPrice + product.price * product.quantity,
              };
            });
          } else {
            set((state) => ({
              ...state,
              items: [...state.items, product],
              totalItems: state.totalItems + product.quantity,
              totalPrice: state.totalPrice + product.price * product.quantity,
            }));
          }
        },
        removeFromCart: (productId: string) => {
          set((state) => {
            const index = state.items.findIndex(
              (item) => item.id === productId
            );
            if (index === -1) return state;
            const items = [...state.items];
            const removed = items.splice(index, 1)[0];
            return {
              ...state,
              items,
              totalItems: state.totalItems - removed.quantity,
              totalPrice: state.totalPrice - removed.price * removed.quantity,
            };
          });
        },
        updateQuantity: (
          productId: string,
          action: "increase" | "decrease"
        ) => {
          set((state) => {
            const index = state.items.findIndex(
              (item) => item.id === productId
            );
            if (index === -1) return state;
            const items = [...state.items];
            const item = items[index];
            const quantity =
              action === "increase" ? item.quantity + 1 : item.quantity - 1;
            if (quantity <= 0) {
              const removed = items.splice(index, 1)[0];
              return {
                ...state,
                items,
                totalItems: state.totalItems - removed.quantity,
                totalPrice: state.totalPrice - removed.price * removed.quantity,
              };
            } else {
              item.quantity = quantity;
              return {
                ...state,
                items,
                totalItems: state.totalItems + (action === "increase" ? 1 : -1),
                totalPrice:
                  state.totalPrice +
                  (action === "increase" ? item.price : -item.price),
              };
            }
          });
        },
        emptyCart: () => {
          set((state) => ({
            ...state,
            items: [],
            totalItems: 0,
            totalPrice: 0,
          }));
        },
      }),
      { name: "shop.co" }
    )
  )
);
