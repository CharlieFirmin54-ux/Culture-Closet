export type Category = "footwear" | "tracksuits" | "accessories";

export type ProductSize =
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "S"
  | "M"
  | "L"
  | "XL"
  | "One Size";

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  category: Category;
  description: string;
  image: string;
  sizes: ProductSize[];
  inventory: Record<string, number>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: "customer" | "admin";
  createdAt: string;
}

export interface CartItem {
  productId: string;
  size: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export type OrderChannel = "online" | "in_person";
export type PaymentMethod =
  | "card"
  | "apple_pay"
  | "google_pay"
  | "apple_pay_in_person";

export interface Order {
  id: string;
  userId?: string;
  email: string;
  items: OrderItem[];
  total: number;
  currency: "gbp";
  channel: OrderChannel;
  paymentMethod: PaymentMethod;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
  stripePaymentIntentId?: string;
}

export interface StoreData {
  products: Product[];
  users: User[];
  orders: Order[];
}
