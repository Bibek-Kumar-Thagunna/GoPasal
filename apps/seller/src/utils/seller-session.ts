import apiClient from '../services/api';
import { storage } from './storage';
import { readJwtTenantId } from './jwt';

export type SellerSessionSyncResult = {
  hasStore: boolean;
  tenantSynced: boolean;
};

/** Re-issue JWT with store tenant when the user has a store but token lacks tenantId. */
export async function syncSellerTenantToken(): Promise<SellerSessionSyncResult> {
  const accessToken = await storage.getItemAsync('accessToken');
  if (!accessToken) {
    return { hasStore: false, tenantSynced: false };
  }

  try {
    const { data } = await apiClient.get('/seller/stores/me');
    const payload = data?.data as {
      hasStore?: boolean;
      activeStoreId?: string;
      store?: { id?: string } | null;
      stores?: Array<{ id?: string }>;
    } | undefined;

    if (!payload?.hasStore) {
      return { hasStore: false, tenantSynced: true };
    }

    const storeId =
      payload.activeStoreId ??
      payload.store?.id ??
      payload.stores?.find((s) => s.id)?.id;

    if (!storeId) {
      return { hasStore: true, tenantSynced: false };
    }

    const currentTenant = readJwtTenantId(accessToken);
    if (currentTenant === storeId) {
      return { hasStore: true, tenantSynced: true };
    }

    const { data: switchRes } = await apiClient.post('/seller/auth/switch-store', {
      storeId,
    });
    const tokens = switchRes?.data?.tokens as
      | { accessToken?: string; refreshToken?: string }
      | undefined;

    if (tokens?.accessToken) {
      await storage.setItemAsync('accessToken', tokens.accessToken);
    }
    if (tokens?.refreshToken) {
      await storage.setItemAsync('refreshToken', tokens.refreshToken);
    }

    return { hasStore: true, tenantSynced: true };
  } catch {
    return { hasStore: true, tenantSynced: false };
  }
}
