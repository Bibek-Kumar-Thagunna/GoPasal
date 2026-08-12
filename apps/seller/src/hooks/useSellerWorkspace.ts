import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/api';
import { useAuthStore } from '../store/auth.store';

export type SellerStoreMePayload = {
  hasStore?: boolean;
  store: Record<string, unknown> | null;
  stores?: Array<
    Record<string, unknown> & {
      id: string;
      name?: string;
      parentStoreId?: string | null;
      accessRole?: string;
      staffRoles?: string[];
      staffRole?: string;
    }
  >;
  activeStoreId?: string;
  accessRole?: string;
  staffRoles?: string[];
  permissions?: string[];
};

export function useSellerWorkspace() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionReady = useAuthStore((s) => s.sessionReady);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['seller-stores-me'],
    queryFn: async () => {
      const { data: res } = await apiClient.get('/seller/stores/me');
      return res?.data as SellerStoreMePayload | undefined;
    },
    enabled: isAuthenticated && sessionReady,
    staleTime: 20_000,
  });

  const store = data?.store ?? null;
  const activeStoreId = data?.activeStoreId ?? (store as { id?: string } | null)?.id ?? '';
  const stores = data?.stores ?? (store ? [store] : []);
  const accessRole = data?.accessRole ?? 'OWNER';
  const permissions = data?.permissions ?? [];
  const staffRolesFromMe = data?.staffRoles ?? [];

  const hasPermission = (perm: string) => permissions.includes(perm);

  return {
    payload: data,
    store,
    stores,
    activeStoreId,
    accessRole,
    permissions,
    staffRolesFromMe,
    hasPermission,
    isLoading,
    refetch,
  };
}
