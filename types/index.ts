export type ProductData = {
  products: Product[];
};

export type SingleProduct = {
  product: Product;
};

export type Product = {
  id: string; // Adjust the type if `id` is a number in your schema
  productName: string;
  description: string;
  images: {
    url: string;
    width: number;
    height: number;
    id: string;
  }[];
  price: number;
  discountedPrice: number;
  productDetails: {
    text: string;
  };
  category: {
    id: string; // Adjust if `id` is a number in your schema
    productName: string;
  }[];
  slug: string;
  stock: boolean;
  colours: {
    hex: string;
  }[];
  productTag: string[];
  productSizes: string[];
};

export type images = {
  url: string;
}[];

enum ProductSize {
  XL,
  MEDIUM,
  LARGE,
  XXL,
  SMALL,
  XS,
}

export enum productTags {
  newArrivals = "newArrivals",
  topDeals = "topDeals",
  topSelling = "topSelling",
}

export interface CartProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: any | "";
}

export const ProductSizes = ["xl", "medium", "large", "xxl", "small", "xs"];
