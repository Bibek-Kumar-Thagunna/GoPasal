// Types matching the GoPasal backend API contracts

// ─── Auth ────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  roles?: string[];
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface OtpSendPayload {
  phone: string;
}

export interface OtpVerifyPayload {
  phone: string;
  otp: string;
  deviceId?: string;
}

export interface SocialLoginPayload {
  provider: 'GOOGLE' | 'APPLE';
  token: string;
}

// ─── Catalog ─────────────────────────────────────────────────

export interface StoreServiceability {
  deliverable: boolean;
  distanceKm?: number | null;
  maxRadiusKm?: number;
  code?: string | null;
  message?: string | null;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  coverImage?: string;
  description?: string;
  rating: number;
  reviewCount?: number;
  deliveryTime?: string;
  minOrder?: number;
  isVerified: boolean;
  address: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  deliveryRadius?: number;
  deliveryType?: string;
  serviceability?: StoreServiceability;
  categories?: Category[];
  isOpen?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  productCount?: number;
  parentId?: string;
  children?: Category[];
}

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  basePrice?: number | string;
  compareAtPrice?: number | string;
  currency: string;
  image: string;
  images?: string[];
  category?: Category;
  categoryId: string;
  rating: number;
  reviewCount: number;
  unit: string;
  inStock: boolean;
  storeId: string;
  storeName?: string;
  store?: { id: string; name: string };
  tags?: string[];
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  inStock: boolean;
}

// ─── Cart ────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  variantId: string;
  product?: Product;
  quantity: number;
  price: number;
  total: number;
}

export type DeliveryFeeStatus = 'free' | 'charged' | 'shop_set' | 'pickup_only';

export interface Cart {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  deliveryFeeStatus?: DeliveryFeeStatus;
  discount: number;
  platformFee: number;
  total: number;
  storeId?: string;
  store?: {
    id: string;
    name: string;
    metadata?: Record<string, unknown>;
    deliveryType?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
}

// ─── Orders ──────────────────────────────────────────────────

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PLACED'
  | 'ACCEPTED'
  | 'CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY';

export type PaymentMethod = 'COD' | 'ESEWA' | 'KHALTI';

export type PaymentCapabilities = {
  cod: boolean;
  khalti: boolean;
  esewa: boolean;
  fonepay?: boolean;
  skypay?: boolean;
  aggregator?: string;
  minOnlineAmountPaisa: number;
};

export type OnlinePaymentStart = {
  provider: 'KHALTI' | 'ESEWA';
  formPost?: { action: string; fields: Record<string, string> };
  paymentId: string;
  paymentUrl: string;
  pidx?: string;
  mock?: boolean;
};

export type CheckoutResult = {
  order: Order;
  requiresOnlinePayment?: boolean;
  onlinePayment?: OnlinePaymentStart;
};

export interface Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  platformFee?: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: string;
  paymentCollectionStatus?: string;
  paymentStatusLabel?: string;
  fulfillmentType?: OrderFulfillmentType;
  deliveryAddress?: Address | null;
  store?: Store;
  createdAt: string;
  estimatedDelivery?: string;
  trackingSteps?: TrackingStep[];
  notes?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  total: number;
}

export interface TrackingStep {
  status: string;
  label: string;
  timestamp?: string;
  completed: boolean;
  current?: boolean;
}

export type OrderFulfillmentType = 'MERCHANT_DELIVERY' | 'PICKUP' | 'PLATFORM_LOGISTICS';

export interface CheckoutPayload {
  fulfillmentType?: OrderFulfillmentType;
  deliveryAddressId?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  couponCode?: string;
}

// ─── Address ─────────────────────────────────────────────────

export interface Address {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  contactName?: string;
  contactPhone?: string;
  buildingName?: string;
  floor?: string;
}

export interface AddressPayload {
  label: string;
  addressLine: string;
  city: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
  contactName?: string;
  contactPhone?: string;
  buildingName?: string;
  floor?: string;
}

// ─── Reviews ─────────────────────────────────────────────────

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// ─── Wishlist ────────────────────────────────────────────────

export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  addedAt: string;
}

// ─── Offers ──────────────────────────────────────────────────

export interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  code?: string;
  image?: string;
  banner?: string;
  validUntil: string;
  minOrderValue?: number;
}

// ─── Notifications ───────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

// ─── Delivery ────────────────────────────────────────────────

export interface DeliveryEta {
  estimatedMinutes: number;
  label: string;
  type: 'INSTANT' | 'SAME_DAY' | 'SCHEDULED' | 'STANDARD';
}

// ─── Search ──────────────────────────────────────────────────

export interface SearchResult {
  products: Product[];
  stores: Store[];
  categories: Category[];
  total: number;
}

// ─── API Response ────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Location ────────────────────────────────────────────────

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  formattedAddress?: string;
  placeId?: string;
  city?: string;
}
