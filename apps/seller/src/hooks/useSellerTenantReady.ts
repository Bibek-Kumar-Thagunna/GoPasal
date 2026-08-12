import { useAuthStore } from '../store/auth.store';
import { useSellerWorkspace } from './useSellerWorkspace';

/** True when seller JWT should include a store tenant and workspace has resolved a store id. */
export function useSellerTenantReady() {
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const { activeStoreId, isLoading, payload } = useSellerWorkspace();

  const hasStore = payload?.hasStore === true;
  const isReady = sessionReady && !isLoading && hasStore && !!activeStoreId;

  return { isReady, activeStoreId, isLoading: !sessionReady || isLoading, hasStore };
}
