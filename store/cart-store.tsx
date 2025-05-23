import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { CartProduct } from "./Cart-structure";

// define zustand state and actions
type State = {
  items: CartProduct[];
  totalItems: number;
  totalPrice: number;
};

type Actions = {
  addToCart: (product: CartProduct) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (
    productId: string,
    action: "increase" | "decrease",
    size: string,
    color: string
  ) => void;
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
          const existingIndex = get().items.findIndex(
            (item) =>
              item.id === product.id &&
              item.size === product.size &&
              item.color === product.color
          );

          if (existingIndex !== -1) {
            // Same product, size, and color → increase quantity
            set((state) => {
              const items = [...state.items];
              items[existingIndex].quantity += product.quantity;
              return {
                ...state,
                items,
                totalItems: state.totalItems + product.quantity,
                totalPrice: state.totalPrice + product.price * product.quantity,
              };
            });
          } else {
            // Different size or color → treat as new item
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
          action: "increase" | "decrease",
          size: string,
          color: string
        ) => {
          set((state) => {
            const index = state.items.findIndex(
              (item) =>
                item.id === productId &&
                item.size === size &&
                item.color === color
            );

            if (index === -1) return state;

            const items = [...state.items];
            const item = items[index];

            const newQuantity =
              action === "increase" ? item.quantity + 1 : item.quantity - 1;

            if (newQuantity <= 0) {
              const removed = items.splice(index, 1)[0];
              return {
                ...state,
                items,
                totalItems: state.totalItems - removed.quantity,
                totalPrice: state.totalPrice - removed.price * removed.quantity,
              };
            } else {
              item.quantity = newQuantity;
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
      { name: "shopping.co" }
    )
  )
);
