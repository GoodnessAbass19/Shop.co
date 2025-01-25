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
