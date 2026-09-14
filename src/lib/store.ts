import { promises as fs } from "fs";
import path from "path";
import { seedData } from "./seed";
import type {
  Order,
  Product,
  StoreData,
  User,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

async function ensureStore(): Promise<StoreData> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as StoreData;
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(seedData, null, 2), "utf8");
    return structuredClone(seedData);
  }
}

async function writeStore(data: StoreData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function getStore(): Promise<StoreData> {
  return ensureStore();
}

export async function listProducts(opts?: {
  includeInactive?: boolean;
  category?: string;
}): Promise<Product[]> {
  const store = await ensureStore();
  return store.products.filter((p) => {
    if (!opts?.includeInactive && !p.active) return false;
    if (opts?.category && p.category !== opts.category) return false;
    return true;
  });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const store = await ensureStore();
  return store.products.find((p) => p.slug === slug && p.active) ?? null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const store = await ensureStore();
  return store.products.find((p) => p.id === id) ?? null;
}

export async function updateInventory(
  productId: string,
  inventory: Record<string, number>
): Promise<Product | null> {
  const store = await ensureStore();
  const product = store.products.find((p) => p.id === productId);
  if (!product) return null;
  product.inventory = inventory;
  product.updatedAt = new Date().toISOString();
  await writeStore(store);
  return product;
}

export async function setProductActive(
  productId: string,
  active: boolean
): Promise<Product | null> {
  const store = await ensureStore();
  const product = store.products.find((p) => p.id === productId);
  if (!product) return null;
  product.active = active;
  product.updatedAt = new Date().toISOString();
  await writeStore(store);
  return product;
}

export async function removeProduct(productId: string): Promise<boolean> {
  const store = await ensureStore();
  const before = store.products.length;
  store.products = store.products.filter((p) => p.id !== productId);
  if (store.products.length === before) return false;
  await writeStore(store);
  return true;
}

export async function decrementStock(
  items: { productId: string; size: string; quantity: number }[]
): Promise<{ ok: boolean; error?: string }> {
  const store = await ensureStore();
  for (const item of items) {
    const product = store.products.find((p) => p.id === item.productId);
    if (!product || !product.active) {
      return { ok: false, error: `Product unavailable: ${item.productId}` };
    }
    const available = product.inventory[item.size] ?? 0;
    if (available < item.quantity) {
      return {
        ok: false,
        error: `Not enough stock for ${product.name} (${item.size})`,
      };
    }
  }
  for (const item of items) {
    const product = store.products.find((p) => p.id === item.productId)!;
    product.inventory[item.size] =
      (product.inventory[item.size] ?? 0) - item.quantity;
    product.updatedAt = new Date().toISOString();
  }
  await writeStore(store);
  return { ok: true };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const store = await ensureStore();
  return (
    store.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ??
    null
  );
}

export async function findUserById(id: string): Promise<User | null> {
  const store = await ensureStore();
  return store.users.find((u) => u.id === id) ?? null;
}

export async function createUser(
  user: Omit<User, "id" | "createdAt">
): Promise<User> {
  const store = await ensureStore();
  const created: User = {
    ...user,
    id: `u-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
  };
  store.users.push(created);
  await writeStore(store);
  return created;
}

export async function createOrder(order: Order): Promise<Order> {
  const store = await ensureStore();
  store.orders.unshift(order);
  await writeStore(store);
  return order;
}

export async function listOrders(): Promise<Order[]> {
  const store = await ensureStore();
  return store.orders;
}

export function totalUnits(product: Product): number {
  return Object.values(product.inventory).reduce((a, b) => a + b, 0);
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}
