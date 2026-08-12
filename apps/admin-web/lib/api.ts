import axios, { AxiosError, type AxiosResponse } from "axios";

function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    if (host.includes("gopasal.com")) {
      return "https://api.gopasal.com/api/v1";
    }
    if (host !== "localhost" && host !== "127.0.0.1") {
      return `${protocol}//${host}:3000/api/v1`;
    }
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";
}

const API_BASE = getApiBaseUrl();

export type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: { code?: string; message?: string } | null;
};

export function unwrapApi<T>(res: AxiosResponse<ApiEnvelope<T>>): T {
  const body = res.data;
  if (!body.success || body.data === null || body.data === undefined) {
    throw new Error(body.error?.message ?? "Request failed");
  }
  return body.data;
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("gp_admin_access");
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("gp_admin_refresh");
}

export function setStoredTokens(access: string, refresh: string): void {
  localStorage.setItem("gp_admin_access", access);
  localStorage.setItem("gp_admin_refresh", refresh);
}

export function clearStoredTokens(): void {
  localStorage.removeItem("gp_admin_access");
  localStorage.removeItem("gp_admin_refresh");
}

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const original = error.config;
    if (!original || original.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }
    if (
      error.response?.status === 401 &&
      !(original as { _retry?: boolean })._retry
    ) {
      (original as { _retry?: boolean })._retry = true;
      const refresh = getStoredRefreshToken();
      if (refresh) {
        try {
          const res = await axios.post<
            ApiEnvelope<{ accessToken: string; refreshToken: string }>
          >(`${API_BASE}/auth/refresh`, { refreshToken: refresh });
          const tokens = unwrapApi(res);
          setStoredTokens(tokens.accessToken, tokens.refreshToken);
          original.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return api(original);
        } catch {
          clearStoredTokens();
        }
      }
    }
    return Promise.reject(error);
  }
);

export type LoginResponse = {
  user: {
    id: string;
    email: string | null;
    phone: string;
    name: string | null;
  };
  tokens: { accessToken: string; refreshToken: string };
};

export async function adminLogin(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await api.post<ApiEnvelope<LoginResponse>>("/admin/auth/login", {
    email,
    password,
  });
  return unwrapApi(res);
}

export async function adminGoogleLogin(idToken: string): Promise<LoginResponse> {
  const res = await api.post<ApiEnvelope<LoginResponse>>("/admin/auth/google", {
    idToken,
  });
  return unwrapApi(res);
}

export async function adminSendOtp(phone: string): Promise<void> {
  unwrapApi(
    await api.post<ApiEnvelope<{ message: string; expiresIn: number }>>(
      "/admin/auth/otp/send",
      { phone }
    )
  );
}

export async function adminVerifyOtp(
  phone: string,
  otp: string
): Promise<LoginResponse> {
  const res = await api.post<ApiEnvelope<LoginResponse>>(
    "/admin/auth/otp/verify",
    { phone, otp }
  );
  return unwrapApi(res);
}

export type MeProfile = {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  roles: string[];
};

export async function fetchMe(): Promise<MeProfile> {
  const res = await api.get<ApiEnvelope<MeProfile>>("/auth/me");
  return unwrapApi(res);
}

export async function logoutServer(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    /* ignore */
  }
}

export type AdminCustomerPlan = {
  id: string;
  name: string;
  slug: string | null;
  benefits: Record<string, unknown>;
  price: string;
  durationDays: number;
  deliveryFreeThreshold: string | null;
  isPriorityDelivery: boolean | null;
  isActive: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AdminStoreMarketingPlan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthlyPrice: string;
  benefits: Record<string, unknown>;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export async function fetchAdminCustomerPlans(): Promise<AdminCustomerPlan[]> {
  const res = await api.get<ApiEnvelope<AdminCustomerPlan[]>>(
    "/admin/tiers/customer-plans"
  );
  return unwrapApi(res);
}

export async function fetchAdminStoreMarketingPlans(): Promise<
  AdminStoreMarketingPlan[]
> {
  const res = await api.get<ApiEnvelope<AdminStoreMarketingPlan[]>>(
    "/admin/tiers/store-plans"
  );
  return unwrapApi(res);
}

export type DashStats = {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  activeStores: number;
};

export type OrderStatusBreakdown = {
  breakdown: { status: string; count: number; percent: number }[];
  totalOrders: number;
};

export type RecentOrderRow = {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  customerName: string | null;
  customerPhone: string;
  storeName: string;
};

export type CatalogOverview = {
  activeProducts: number;
  storesTotal: number;
};

export async function fetchAdminDashboardStats(): Promise<DashStats> {
  const res = await api.get<ApiEnvelope<DashStats>>("/admin/analytics/dashboard");
  return unwrapApi(res);
}

export async function fetchAdminOrderStatusCounts(): Promise<OrderStatusBreakdown> {
  const res = await api.get<ApiEnvelope<OrderStatusBreakdown>>(
    "/admin/analytics/order-status-counts"
  );
  return unwrapApi(res);
}

export async function fetchAdminRecentOrders(
  limit = 8
): Promise<RecentOrderRow[]> {
  const res = await api.get<ApiEnvelope<RecentOrderRow[]>>(
    `/admin/analytics/recent-orders?limit=${limit}`
  );
  return unwrapApi(res);
}

export async function fetchAdminCatalogOverview(): Promise<CatalogOverview> {
  const res = await api.get<ApiEnvelope<CatalogOverview>>(
    "/admin/analytics/catalog-overview"
  );
  return unwrapApi(res);
}

export async function fetchAdminRevenueChart(): Promise<
  Record<string, string | number>[]
> {
  const res =
    await api.get<ApiEnvelope<Record<string, string | number>[]>>(
      "/admin/analytics/revenue-chart"
    );
  const raw = unwrapApi(res);
  return Array.isArray(raw) ? raw : [];
}

export type TopProductRow = {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
};

export async function fetchAdminTopProducts(): Promise<TopProductRow[]> {
  const res = await api.get<ApiEnvelope<TopProductRow[]>>(
    "/admin/analytics/top-products"
  );
  return unwrapApi(res);
}

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type AdminUserRow = {
  id: string;
  phone: string;
  email: string | null;
  name: string | null;
  isActive: boolean | null;
  isPhoneVerified: boolean | null;
  lastLoginAt: string | null;
  createdAt: string;
  roles: string[];
};

export async function fetchAdminUsers(params: {
  page?: number;
  limit?: number;
  q?: string;
}): Promise<Paginated<AdminUserRow>> {
  const res = await api.get<ApiEnvelope<Paginated<AdminUserRow>>>(
    "/admin/users",
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 25,
        q: params.q ?? undefined,
      },
    }
  );
  return unwrapApi(res);
}

export async function patchAdminUserActive(
  userId: string,
  isActive: boolean
): Promise<unknown> {
  const res = await api.patch<ApiEnvelope<unknown>>(
    `/admin/users/${userId}/active`,
    { isActive }
  );
  return unwrapApi(res);
}

export type TenantListResponse = Paginated<Record<string, unknown>>;

export async function fetchAdminTenants(params: {
  page?: number;
  limit?: number;
  q?: string;
  lane?: "review" | "active" | "suspended";
}): Promise<TenantListResponse> {
  const res = await api.get<ApiEnvelope<TenantListResponse>>("/admin/tenants", {
    params: {
      page: params.page,
      limit: params.limit,
      q: params.q?.trim() || undefined,
      lane: params.lane || undefined,
    },
  });
  return unwrapApi(res);
}

export async function rejectSeller(
  storeId: string,
  reason: string
): Promise<{ success: boolean }> {
  const res = await api.post<ApiEnvelope<{ success: boolean }>>(
    `/admin/governance/sellers/${storeId}/reject`,
    { reason }
  );
  return unwrapApi(res);
}

export async function resendSellerToSetup(
  storeId: string
): Promise<{ success: boolean }> {
  const res = await api.post<ApiEnvelope<{ success: boolean }>>(
    `/admin/governance/sellers/${storeId}/resend-setup`
  );
  return unwrapApi(res);
}

export async function fetchAdminTenant(storeId: string): Promise<Record<string, unknown>> {
  const res = await api.get<ApiEnvelope<Record<string, unknown>>>(
    `/admin/tenants/${storeId}`
  );
  return unwrapApi(res);
}

export type AdminSettlementRow = {
  id: string;
  storeId: string;
  status: string;
  netAmount: string;
  grossAmount: string;
  periodStart: string;
  periodEnd: string;
  transactionRef?: string | null;
  store?: { id: string; name: string; slug: string };
};

export async function fetchAdminSettlements(params: {
  page?: number;
  limit?: number;
  storeId?: string;
}): Promise<Paginated<AdminSettlementRow>> {
  const res = await api.get<ApiEnvelope<Paginated<AdminSettlementRow>>>(
    "/admin/governance/settlements",
    { params }
  );
  return unwrapApi(res);
}

export async function approveSeller(storeId: string): Promise<{ success: boolean }> {
  const res = await api.post<ApiEnvelope<{ success: boolean }>>(
    `/admin/governance/sellers/${storeId}/approve`
  );
  return unwrapApi(res);
}

export async function suspendSeller(
  storeId: string,
  reason: string
): Promise<{ success: boolean }> {
  const res = await api.post<ApiEnvelope<{ success: boolean }>>(
    `/admin/governance/sellers/${storeId}/suspend`,
    { reason }
  );
  return unwrapApi(res);
}

export async function patchTenantCommission(
  storeId: string,
  rate: number
): Promise<unknown> {
  const res = await api.put<ApiEnvelope<unknown>>(
    `/admin/tenants/${storeId}/commission`,
    { rate }
  );
  return unwrapApi(res);
}

export type AdminOrderRow = {
  id: string;
  status: string;
  totalAmount: string;
  paymentStatus: string;
  paymentMethod: string;
  fulfillmentType: string;
  createdAt: string;
  customerPhone: string;
  customerName: string | null;
  storeName: string;
};

export async function fetchAdminOrders(params: {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
}): Promise<Paginated<AdminOrderRow>> {
  const res = await api.get<ApiEnvelope<Paginated<AdminOrderRow>>>(
    "/admin/orders",
    { params }
  );
  return unwrapApi(res);
}

export type AdminOrderDetail = AdminOrderRow & {
  storeId: string;
  userId: string;
  notes?: string | null;
  pricingSnapshot?: unknown;
  customerEmail?: string | null;
  storeSlug?: string;
  items: {
    id: string;
    quantity: number;
    priceAtPurchase: string;
    productName: string;
    variantName?: string | null;
  }[];
};

export async function fetchAdminOrderDetail(orderId: string): Promise<AdminOrderDetail> {
  const res = await api.get<ApiEnvelope<AdminOrderDetail>>(`/admin/orders/${orderId}`);
  return unwrapApi(res);
}

export async function patchTenantStatus(
  storeId: string,
  status: string,
  notes?: string
): Promise<unknown> {
  const res = await api.put<ApiEnvelope<unknown>>(`/admin/tenants/${storeId}/status`, {
    status,
    notes,
  });
  return unwrapApi(res);
}

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  storeId: string;
  storeName: string | null;
  basePrice: string;
  isActive: boolean | null;
  createdAt: string | null;
};

export async function fetchAdminProducts(params: {
  page?: number;
  limit?: number;
  q?: string;
  storeId?: string;
  includeInactive?: boolean;
}): Promise<Paginated<AdminProductRow>> {
  const res = await api.get<ApiEnvelope<Paginated<AdminProductRow>>>(
    "/admin/catalog/products",
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 25,
        q: params.q ?? undefined,
        storeId: params.storeId ?? undefined,
        includeInactive:
          params.includeInactive === true ? "true" : undefined,
      },
    }
  );
  return unwrapApi(res);
}

export type AdminProductStoreOpt = {
  id: string;
  name: string;
  slug: string;
  status: string | null;
};

export async function fetchAdminProductStores(): Promise<
  AdminProductStoreOpt[]
> {
  const res = await api.get<ApiEnvelope<AdminProductStoreOpt[]>>(
    "/admin/catalog/products/stores"
  );
  return unwrapApi(res);
}

export async function patchAdminProductActive(
  productId: string,
  isActive: boolean
): Promise<unknown> {
  const res = await api.patch<ApiEnvelope<unknown>>(
    `/admin/catalog/products/${productId}/active`,
    { isActive }
  );
  return unwrapApi(res);
}

export type AdminCouponRow = {
  id: string;
  storeId: string;
  storeName?: string | null;
  isPlatformWide?: boolean;
  code: string;
  type: "FIXED" | "PERCENT";
  value: string;
  minOrderValue: string | null;
  maxDiscount: string | null;
  requiresGold?: boolean | null;
  status: "ACTIVE" | "PAUSED" | "EXPIRED" | string;
  usageLimitTotal: number | null;
  usageLimitPerUser: number | null;
  usedCount: number | null;
  startDate: string;
  endDate: string;
};

export async function fetchAdminCoupons(params: {
  page?: number;
  limit?: number;
  q?: string;
  storeId?: string;
}): Promise<Paginated<AdminCouponRow>> {
  const res = await api.get<ApiEnvelope<Paginated<AdminCouponRow>>>(
    "/admin/promotions/coupons",
    { params }
  );
  return unwrapApi(res);
}

export async function patchAdminCouponStatus(
  couponId: string,
  status: "ACTIVE" | "PAUSED"
): Promise<unknown> {
  const res = await api.patch<ApiEnvelope<unknown>>(
    `/admin/promotions/coupons/${couponId}/status`,
    { status }
  );
  return unwrapApi(res);
}

export async function createAdminCoupon(body: {
  storeId?: string;
  code: string;
  type: "FIXED" | "PERCENT";
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimitTotal?: number;
  usageLimitPerUser?: number;
  requiresMembership?: boolean;
}): Promise<{ success: boolean; id: string }> {
  const res = await api.post<
    ApiEnvelope<{ success: boolean; id: string }>
  >("/admin/promotions/coupons", body);
  return unwrapApi(res);
}

export type AdminConfigRow = { key: string; value: unknown; description?: string };

export async function fetchAdminConfigs(): Promise<unknown[]> {
  const res = await api.get<ApiEnvelope<unknown[]>>("/admin/configs");
  return unwrapApi(res);
}

export async function upsertAdminConfig(
  key: string,
  value: unknown,
  description?: string
): Promise<unknown> {
  const res = await api.put<ApiEnvelope<unknown>>(
    `/admin/configs/${encodeURIComponent(key)}`,
    { value, description }
  );
  return unwrapApi(res);
}

export type AdminFeatureFlag = {
  id: string;
  key: string;
  description?: string | null;
  isEnabled: boolean;
  clientSide?: boolean;
};

export async function fetchAdminFeatureFlags(): Promise<AdminFeatureFlag[]> {
  const res = await api.get<ApiEnvelope<AdminFeatureFlag[]>>("/admin/feature-flags");
  return unwrapApi(res);
}

export async function seedAdminFeatureFlags(): Promise<{ message: string }> {
  const res = await api.post<ApiEnvelope<{ message: string }>>(
    "/admin/feature-flags/seed-defaults"
  );
  return unwrapApi(res);
}

export async function patchAdminFeatureFlag(
  key: string,
  isEnabled: boolean
): Promise<{ key: string; isEnabled: boolean }> {
  const res = await api.patch<ApiEnvelope<{ key: string; isEnabled: boolean }>>(
    `/admin/feature-flags/${encodeURIComponent(key)}`,
    { isEnabled }
  );
  return unwrapApi(res);
}

export type AdminDispute = {
  id: string;
  orderId: string;
  reporterId: string;
  reason: string;
  status: string;
  priority: string | null;
  createdAt?: string | null;
};

export async function fetchAdminDisputes(
  status?: string
): Promise<AdminDispute[]> {
  const res = await api.get<ApiEnvelope<AdminDispute[]>>("/admin/disputes", {
    params: status ? { status } : {},
  });
  return unwrapApi(res);
}

export async function resolveAdminDispute(
  id: string,
  body: {
    action: "REFUND" | "RELEASE" | "REJECT";
    refundAmount?: string;
    notes?: string;
  }
): Promise<unknown> {
  const res = await api.put<ApiEnvelope<unknown>>(
    `/admin/disputes/${id}/resolve`,
    body
  );
  return unwrapApi(res);
}

export type AdminRiderRow = {
  id: string;
  userId: string;
  phone: string;
  name: string | null;
  status: string;
  vehicleType: string;
  licensePlate: string;
  tier: string | null;
  walletBalance: string | null;
};

export async function fetchAdminRiders(
  params?: { limit?: number }
): Promise<AdminRiderRow[]> {
  const res = await api.get<ApiEnvelope<AdminRiderRow[]>>("/admin/delivery/riders", {
    params: params?.limit != null ? { limit: params.limit } : undefined,
  });
  return unwrapApi(res);
}

export type AdminDeliveryTaskRow = {
  taskId: string;
  orderId: string;
  riderId: string | null;
  taskStatus: string;
  codCollected: boolean | null;
  codAmount: string | null;
  failureReason: string | null;
  taskCreatedAt: string;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  orderStatus: string;
  paymentMethod: string;
  customerPhone: string;
  customerName: string | null;
  storeName: string;
};

export async function fetchAdminDeliveryTasks(params?: {
  limit?: number;
  status?: string;
}): Promise<AdminDeliveryTaskRow[]> {
  const res = await api.get<ApiEnvelope<AdminDeliveryTaskRow[]>>(
    "/admin/delivery/tasks",
    {
      params: {
        limit: params?.limit,
        ...(params?.status?.trim() ? { status: params.status.trim() } : {}),
      },
    }
  );
  return unwrapApi(res);
}

export type AdminRefundBody = {
  orderId: string;
  amount: string;
  reason: string;
};

export async function postAdminRefund(
  body: AdminRefundBody
): Promise<unknown> {
  const res = await api.post<ApiEnvelope<unknown>>(
    "/admin/governance/refunds",
    body
  );
  return unwrapApi(res);
}

export async function postAdminGenerateSettlement(body: {
  storeId: string;
  periodStart: string;
  periodEnd: string;
}): Promise<unknown> {
  const res = await api.post<ApiEnvelope<unknown>>(
    "/admin/governance/settlements/generate",
    body
  );
  return unwrapApi(res);
}

export async function postAdminSettlementPayout(
  settlementId: string,
  transactionRef: string
): Promise<unknown> {
  const res = await api.post<ApiEnvelope<unknown>>(
    `/admin/governance/settlements/${settlementId}/payout`,
    { transactionRef }
  );
  return unwrapApi(res);
}

export type WebhookEventRow = {
  id: string;
  provider: string;
  externalEventId: string;
  orderId: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  processedAt: string | null;
};

export async function fetchAdminWebhooks(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{ items: WebhookEventRow[]; total: number }> {
  const q = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 20),
  });
  if (params?.status) q.set("status", params.status);
  const res = await api.get<
    ApiEnvelope<{ items: WebhookEventRow[]; total: number }>
  >(`/admin/governance/webhooks?${q.toString()}`);
  return unwrapApi(res) as { items: WebhookEventRow[]; total: number };
}

export type CodRecordRow = {
  id: string;
  orderId: string;
  riderId: string;
  expectedAmount: string;
  collectedAmount: string;
  status: string;
  isReconciled: boolean;
  createdAt: string;
};

export async function fetchAdminCodRecords(params?: {
  page?: number;
  limit?: number;
}): Promise<{ items: CodRecordRow[]; total: number }> {
  const q = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 20),
  });
  const res = await api.get<
    ApiEnvelope<{ items: CodRecordRow[]; total: number }>
  >(`/admin/governance/cod-records?${q.toString()}`);
  return unwrapApi(res) as { items: CodRecordRow[]; total: number };
}

export async function fetchAdminReviewsPage(params: {
  page?: number;
  filter?: "pending" | "hidden" | "all";
}): Promise<unknown[]> {
  const q = new URLSearchParams({ page: String(params.page ?? 1) });
  if (params.filter && params.filter !== "all") {
    q.set("filter", params.filter);
  }
  const res =
    await api.get<ApiEnvelope<unknown[]>>(`/reviews/admin/all?${q.toString()}`);
  return unwrapApi(res);
}

export async function moderateReviewApi(
  reviewId: string,
  body: { action: "HIDE" | "SHOW" | "FLAG"; note?: string }
): Promise<unknown> {
  const res = await api.put<ApiEnvelope<unknown>>(
    `/reviews/${reviewId}/moderate`,
    body
  );
  return unwrapApi(res);
}

export async function patchAdminCustomerPlan(
  id: string,
  body: Partial<{
    isActive: boolean;
    name: string;
    slug: string;
    benefits: Record<string, unknown>;
    price: string;
    durationDays: number;
    isPriorityDelivery: boolean;
    deliveryFreeThreshold: string;
  }>
): Promise<unknown> {
  const res = await api.patch<ApiEnvelope<unknown>>(
    `/admin/tiers/customer-plans/${id}`,
    body
  );
  return unwrapApi(res);
}

export async function patchAdminStoreMarketingPlan(
  id: string,
  body: Partial<{
    isActive: boolean;
    name: string;
    description: string;
    monthlyPrice: string;
    benefits: Record<string, unknown>;
  }>
): Promise<unknown> {
  const res = await api.patch<ApiEnvelope<unknown>>(
    `/admin/tiers/store-plans/${id}`,
    body
  );
  return unwrapApi(res);
}

export async function fetchAdminCustomerSubscriptions(): Promise<unknown[]> {
  const res = await api.get<ApiEnvelope<unknown[]>>(
    "/admin/tiers/customer-subscriptions"
  );
  return unwrapApi(res);
}

export async function fetchAdminStoreMarketingSubscriptions(): Promise<
  unknown[]
> {
  const res = await api.get<ApiEnvelope<unknown[]>>(
    "/admin/tiers/store-subscriptions"
  );
  return unwrapApi(res);
}

export async function sendAdminNotification(body: {
  userId?: string;
  phone?: string;
  title: string;
  message: string;
  type?: string;
}): Promise<unknown> {
  const res = await api.post<ApiEnvelope<unknown>>(
    "/admin/notifications/send",
    body
  );
  return unwrapApi(res);
}

export async function broadcastAdminNotification(body: {
  title: string;
  message: string;
  type?: string;
  limit?: number;
}): Promise<{ sent: number }> {
  const res = await api.post<ApiEnvelope<{ sent: number }>>(
    "/admin/notifications/broadcast",
    body
  );
  return unwrapApi(res);
}

export async function assignAdminDeliveryTask(
  taskId: string,
  riderId: string
): Promise<unknown> {
  const res = await api.patch<ApiEnvelope<unknown>>(
    `/admin/delivery/tasks/${taskId}/assign`,
    { riderId }
  );
  return unwrapApi(res);
}

export type AdminDisputeMessage = {
  id: string;
  disputeId: string;
  senderId: string;
  senderRole: string;
  message: string;
  createdAt: string;
};

export async function fetchAdminDisputeMessages(
  disputeId: string
): Promise<AdminDisputeMessage[]> {
  const res = await api.get<ApiEnvelope<AdminDisputeMessage[]>>(
    `/admin/disputes/${disputeId}/messages`
  );
  return unwrapApi(res);
}

export async function postAdminDisputeMessage(
  disputeId: string,
  message: string
): Promise<unknown> {
  const res = await api.post<ApiEnvelope<unknown>>(
    `/admin/disputes/${disputeId}/messages`,
    { message }
  );
  return unwrapApi(res);
}
