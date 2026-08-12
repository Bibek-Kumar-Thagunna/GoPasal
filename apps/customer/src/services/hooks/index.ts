import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../api-client';
import { ENDPOINTS } from '../endpoints';
import { QUERY_KEYS } from '../../constants';
import { setTokens, removeTokens } from '../token-storage';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';
import { useConfirmDialogStore } from '../../store/confirm-dialog.store';
import { useTranslation } from '../../i18n';
import { env } from '../../constants/env';

function notify(title: string, message: string) {
  if (Platform.OS === 'web' && typeof globalThis.alert === 'function') {
    globalThis.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}
import { normalizeCart } from '../../utils/cart';
import type {
  User, AuthTokens, OtpSendPayload, OtpVerifyPayload,
  SocialLoginPayload, Category, StoreCategory, Product, Store, Cart,
  Order, Address, AddressPayload, CheckoutPayload,
  WishlistItem, Notification, Offer, Review, SearchResult,
  ApiResponse, PaginatedResponse, DeliveryEta,
  PaymentCapabilities, CheckoutResult,
} from '../../types';

// ─── Auth Hooks ──────────────────────────────────────────────

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);

  return useQuery<User | null>({
    queryKey: QUERY_KEYS.auth.me,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<User>>(ENDPOINTS.auth.me);
      const profile = data.data;
      if (profile) {
        useAuthStore.getState().setUser(profile);
      }
      return profile;
    },
    enabled: isAuthenticated,
    initialData: authUser ?? undefined,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSendOtp() {
  return useMutation({
    mutationFn: async (payload: OtpSendPayload) => {
      const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
        ENDPOINTS.auth.otpSend,
        payload
      );
      return data.data;
    },
  });
}

export function useVerifyOtp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OtpVerifyPayload) => {
      const { data } = await apiClient.post<ApiResponse<{ user: User; tokens: AuthTokens }>>(
        ENDPOINTS.auth.otpVerify,
        payload
      );
      await setTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken);
      return data.data;
    },
    onSuccess: (data) => {
      useAuthStore.getState().setUser(data.user);
      queryClient.setQueryData(QUERY_KEYS.auth.me, data.user);
    },
  });
}

export function useSocialLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SocialLoginPayload) => {
      const { data } = await apiClient.post<ApiResponse<{ user: User; tokens: AuthTokens }>>(
        ENDPOINTS.auth.socialLogin,
        payload
      );
      await setTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken);
      return data.data;
    },
    onSuccess: (data) => {
      useAuthStore.getState().setUser(data.user);
      queryClient.setQueryData(QUERY_KEYS.auth.me, data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await apiClient.post(ENDPOINTS.auth.logout);
      } finally {
        await removeTokens();
      }
    },
    onSuccess: () => {
      useAuthStore.getState().setUser(null);
      queryClient.clear();
    },
  });
}

// ─── Catalog Hooks ───────────────────────────────────────────

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: QUERY_KEYS.categories.all,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Category[]>>(ENDPOINTS.categories.list);
      return data.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useStoreCategories() {
  return useQuery<StoreCategory[]>({
    queryKey: QUERY_KEYS.storeCategories.all,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<StoreCategory[]>>(ENDPOINTS.storeCategories.list);
      return data.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useStores(lat?: number, lon?: number) {
  return useQuery<Store[]>({
    queryKey: QUERY_KEYS.stores.list(lat, lon),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (lat !== undefined) params.lat = String(lat);
      if (lon !== undefined) params.lon = String(lon);
      const { data } = await apiClient.get<ApiResponse<Store[]>>(ENDPOINTS.stores.list, { params });
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStore(id: string, lat?: number, lon?: number) {
  return useQuery<Store>({
    queryKey: [...QUERY_KEYS.stores.byId(id), lat, lon],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (lat !== undefined) params.lat = String(lat);
      if (lon !== undefined) params.lon = String(lon);
      const { data } = await apiClient.get<ApiResponse<Store>>(ENDPOINTS.stores.byId(id), {
        params,
      });
      return data.data;
    },
    enabled: !!id,
  });
}

export function useProducts(params?: { q?: string; categoryId?: string; storeCategoryId?: string; storeId?: string; lat?: number; lon?: number; page?: number; limit?: number }) {
  return useQuery<PaginatedResponse<Product>>({
    queryKey: ['products', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Product>>(
        ENDPOINTS.products.list,
        { params }
      );
      return data;
    },
    staleTime: 3 * 60 * 1000,
  });
}

export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: QUERY_KEYS.products.byId(id),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Product>>(ENDPOINTS.products.byId(id));
      return data.data;
    },
    enabled: !!id,
  });
}

// ─── Cart Hooks ──────────────────────────────────────────────

export function useCart() {
  const isLoadingAuth = useAuthStore((s) => s.isLoading);
  return useQuery<Cart>({
    queryKey: QUERY_KEYS.cart,
    enabled: !isLoadingAuth,
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<ApiResponse<Cart>>(ENDPOINTS.cart.get);
        return normalizeCart(data.data);
      } catch (e: any) {
        // Return empty cart if not authenticated or offline/network error
        if (e?.response?.status === 401 || e?.response?.status === 403 || !e?.response) {
          return normalizeCart({ items: [], subtotal: 0, deliveryFee: 0, discount: 0, platformFee: 0, total: 0 });
        }
        throw e;
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (payload: { variantId: string; quantity: number }) => {
      if (!payload.variantId) {
        const err = new Error('NO_VARIANT');
        (err as any).code = 'NO_VARIANT';
        throw err;
      }
      const { data } = await apiClient.post<ApiResponse<Cart>>(ENDPOINTS.cart.addItem, payload);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.cart, normalizeCart(data));
    },
    onError: (error: any, variables) => {
      const code = error?.code;
      const status = error?.response?.status;
      const user = useAuthStore.getState().user;
      const isGuest = !user || user.phone?.startsWith('guest_');

      if (code === 'AUTH_REQUIRED' || status === 401) {
        if (isGuest) {
          // Transparently re-authenticate guest session instead of redirecting to login
          useAuthStore.getState().checkAuth();
        } else {
          router.push('/(auth)/login' as any);
        }
        return;
      }
      if (code === 'NO_VARIANT') {
        notify('Unavailable', 'This item is not available right now. Please try another product.');
        return;
      }
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Could not add to cart. Please try again.';

      const isDifferentStore =
        status === 409 &&
        typeof message === 'string' &&
        message.toLowerCase().includes('different store');

      if (isDifferentStore) {
        useConfirmDialogStore.getState().show({
          title: t('cart.differentShopTitle'),
          message: t('cart.differentShopMsg'),
          confirmLabel: t('cart.clearAndAdd'),
          cancelLabel: t('common.cancel'),
          onConfirm: async () => {
            try {
              await apiClient.delete(ENDPOINTS.cart.clear);
              const { data } = await apiClient.post<ApiResponse<Cart>>(
                ENDPOINTS.cart.addItem,
                variables
              );
              queryClient.setQueryData(QUERY_KEYS.cart, normalizeCart(data.data));
            } catch (retryErr: any) {
              const retryMsg =
                retryErr?.response?.data?.error?.message ||
                retryErr?.response?.data?.message ||
                'Could not add to cart. Please try again.';
              notify(t('cart.title'), retryMsg);
              throw retryErr;
            }
          },
        });
        return;
      }

      notify('Add to cart', message);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { data } = await apiClient.put<ApiResponse<Cart>>(
        ENDPOINTS.cart.updateItem(id),
        { quantity }
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.cart, normalizeCart(data));
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<ApiResponse<Cart>>(ENDPOINTS.cart.removeItem(id));
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.cart, normalizeCart(data));
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete<ApiResponse<any>>(ENDPOINTS.cart.clear);
      return data.data;
    },
    onSuccess: () => {
      queryClient.setQueryData(QUERY_KEYS.cart, { items: [], subtotal: 0, deliveryFee: 0, discount: 0, total: 0 });
    },
  });
}

// ─── Order Hooks ─────────────────────────────────────────────

function normalizePaymentConfig(caps: PaymentCapabilities | undefined): PaymentCapabilities {
  const merged: PaymentCapabilities = {
    cod: caps?.cod !== false,
    khalti: caps?.khalti === true,
    esewa: caps?.esewa === true,
    fonepay: caps?.fonepay === true,
    skypay: caps?.skypay === true,
    aggregator: caps?.aggregator,
    minOnlineAmountPaisa: caps?.minOnlineAmountPaisa ?? 1000,
  };
  if (Platform.OS === 'web') {
    merged.khalti = true;
    merged.esewa = true;
  }
  return merged;
}

export function usePaymentConfig() {
  return useQuery<PaymentCapabilities>({
    queryKey: ['payment-config'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PaymentCapabilities>>(
        ENDPOINTS.payment.config
      );
      return normalizePaymentConfig(data.data);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CheckoutPayload) => {
      const { data } = await apiClient.post<ApiResponse<CheckoutResult>>(
        ENDPOINTS.orders.checkout,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.list });
      queryClient.setQueryData(QUERY_KEYS.cart, { items: [], subtotal: 0, deliveryFee: 0, discount: 0, total: 0 });
    },
  });
}

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: QUERY_KEYS.orders.list,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Order[]>>(ENDPOINTS.orders.list);
      return data.data;
    },
  });
}

export function useOrder(id: string) {
  return useQuery<Order>({
    queryKey: QUERY_KEYS.orders.byId(id),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Order>>(ENDPOINTS.orders.byId(id));
      return data.data;
    },
    enabled: !!id,
    refetchInterval: 30000,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await apiClient.put<ApiResponse<Order>>(
        ENDPOINTS.orders.cancel(id),
        { reason }
      );
      return { data: data.data, id }; // Return id in the success callback
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.list });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.byId(result.id) });
    },
  });
}

// ─── Address Hooks ───────────────────────────────────────────

export function useAddresses() {
  return useQuery<Address[]>({
    queryKey: QUERY_KEYS.addresses,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Address[]>>(ENDPOINTS.addresses.list);
      return data.data;
    },
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddressPayload) => {
      const { data } = await apiClient.post<ApiResponse<Address>>(ENDPOINTS.addresses.create, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.addresses });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<AddressPayload> & { id: string }) => {
      const { data } = await apiClient.put<ApiResponse<Address>>(
        ENDPOINTS.addresses.update(id),
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.addresses });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(ENDPOINTS.addresses.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.addresses });
    },
  });
}

// ─── Wishlist Hooks ──────────────────────────────────────────

export function useWishlist() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<WishlistItem[]>({
    queryKey: QUERY_KEYS.wishlist,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<WishlistItem[]>>(ENDPOINTS.wishlist.list);
      return data.data;
    },
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!isAuthenticated) {
        const err = new Error('AUTH_REQUIRED');
        (err as any).code = 'AUTH_REQUIRED';
        throw err;
      }
      const { data } = await apiClient.post<ApiResponse<{ added: boolean }>>(
        ENDPOINTS.wishlist.toggle,
        { productId }
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wishlist });
    },
    onError: (error: any) => {
      const code = error?.code;
      const status = error?.response?.status;
      if (code === 'AUTH_REQUIRED' || status === 401) {
        router.push('/(auth)/login' as any);
        return;
      }
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Could not update wishlist. Please try again.';
      notify('Wishlist', message);
    },
  });
}

/** @deprecated Use useToggleWishlist */
export function useAddToWishlist() {
  return useToggleWishlist();
}

/** @deprecated Use useToggleWishlist — pass productId, not wishlist row id */
export function useRemoveFromWishlist() {
  return useToggleWishlist();
}

// ─── Notification Hooks ──────────────────────────────────────

import EventSource from 'react-native-sse';

export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<Notification[]>({
    queryKey: QUERY_KEYS.notifications,
    enabled: !!(user && isAuthenticated),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Notification[]>>(
        ENDPOINTS.notifications.list
      );
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRealtimeNotifications() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    let es: any = null;
    let isMounted = true;

    import('../token-storage').then(({ getAccessToken }) => {
      getAccessToken().then((token) => {
        if (!isMounted) return;
        if (!token) return;

        let url = `${env.apiBaseUrl}/notifications/stream`;

        if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).EventSource) {
          url += `?token=${token}`;
          es = new (window as any).EventSource(url);
        } else {
          import('react-native-sse').then(({ default: EventSource }) => {
            if (!isMounted) return;
            es = new EventSource(url, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            attachListener(es);
          }).catch(() => {});
          return;
        }

        attachListener(es);

        function attachListener(eventSource: any) {
          if (!eventSource) return;
          eventSource.addEventListener('message', (event: any) => {
            if (event.data && event.data !== 'connected' && event.data !== 'ping') {
              try {
                const notification = JSON.parse(event.data);
                qc.setQueryData<Notification[]>(QUERY_KEYS.notifications, (old) => {
                  if (!old) return [notification];
                  if (old.some((n) => n.id === notification.id)) return old;
                  return [notification, ...old];
                });
                
                const title = notification.title?.toLowerCase() || '';
                if (title.includes('order')) {
                  qc.invalidateQueries({ queryKey: ['orders'] });
                }
              } catch (e) {
                console.error("Failed to parse SSE notification", e);
              }
            }
          });
        }
      });
    });

    return () => {
      isMounted = false;
      if (es && typeof es.close === 'function') {
        if (typeof es.removeAllEventListeners === 'function') {
          es.removeAllEventListeners();
        }
        es.close();
      }
    };
  }, [qc, user]);
}

// ─── Offer Hooks ─────────────────────────────────────────────

export function useOffers() {
  return useQuery<Offer[]>({
    queryKey: QUERY_KEYS.offers,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Offer[]>>(ENDPOINTS.offers.list);
      return data.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// ─── Review Hooks ────────────────────────────────────────────

export function useReviews(productId: string) {
  return useQuery<Review[]>({
    queryKey: QUERY_KEYS.reviews.byProduct(productId),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Review[]>>(
        ENDPOINTS.reviews.list(productId)
      );
      return data.data;
    },
    enabled: !!productId,
  });
}

// ─── Profile Hooks ───────────────────────────────────────────

export function useProfile() {
  return useQuery<User>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<User>>(ENDPOINTS.profile);
      return data.data;
    },
  });
}

export { useSubmitReview } from '../useSubmitReview';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Pick<User, 'name' | 'email' | 'avatarUrl'>>) => {
      const { data } = await apiClient.put<ApiResponse<User>>(ENDPOINTS.profile, payload);
      return data.data;
    },
    onSuccess: (updated) => {
      useAuthStore.getState().setUser(updated);
      queryClient.setQueryData(QUERY_KEYS.auth.me, updated);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
