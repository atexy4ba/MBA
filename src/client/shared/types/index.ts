export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  categoryId: number;
  isQuantityPricing: boolean;
  metadata: Record<string, unknown> | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Variant {
  id: number;
  productId: number;
  color: string;
  size: string;
  price: string;
  stock: number;
  sku: string;
  imageUrl: string | null;
}

export interface PricingTier {
  id: number;
  productId: number;
  minQuantity: number;
  price: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface CategoryTree extends Category {
  children: Category[];
}

export interface ProductWithVariants extends Product {
  variants: Variant[];
  imageUrl?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ProductDetailResponse {
  data: Product & {
    category: Pick<Category, 'id' | 'name' | 'slug'> | null;
    variants: Variant[];
    pricingTiers: PricingTier[];
  };
}

export interface OrderFormData {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  notes?: string;
  items: { variantId: number; quantity: number }[];
}

export interface AnalyticsEvent {
  type: string;
  productId?: number;
  pageUrl?: string;
  metadata?: Record<string, unknown>;
}
