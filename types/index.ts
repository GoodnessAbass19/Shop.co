import { link } from "fs";

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
    // width: number;
    // height: number;
    // id: string;
  }[];
  price: number;
  discountedPrice: number;
  productDetails: {
    text: string;
  };
  category: {
    id: string; // Adjust if `id` is a number in your schema
    categoryName: string;
    slug: string;
  }[];
  slug: string;
  stock: boolean;
  colours: {
    hex: string;
    css: string;
  }[];
  productTag: string[];
  productSizes: string[];
  review: string[];
  subCategory: {
    title: string;
    slug: string;
  }[];
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

export const ProductSizes = ["xl", "medium", "large", "xxl", "small", "xs"];

export const Shoplist = [
  {
    title: "women",
    link: "/womens-fashion",
    list: ["clothing", "shoes", "skirt-and-shorts"],
  },
  {
    title: "men",
    link: "/mens-fashion",
    list: ["clothing", "shoes", "T-shirt"],
  },
  {
    title: "kid",
    link: "/kids-fashion",
    list: ["boys-fashion", "girls-fashion"],
  },
];

type Image = {
  url: string;
};

export type ProductNode = {
  id: string;
  productName: string;
  slug: string;
  images: Image[];
  price: number;
  discountedPrice: number;
};

export type ProductEdge = {
  node: ProductNode;
};

export type ProductsConnection = {
  edges: ProductEdge[];
};

export type Data = {
  productsConnection: ProductsConnection;
};

export interface CartProduct {
  id?: string; // Optional since Prisma will auto-generate it
  userId: string;
  name: string;
  slug: string;
  image?: string | null;
  price: number;
  quantity: number;
  size?: string | null; // Nullable
  color?: string | null; // Nullable
}
