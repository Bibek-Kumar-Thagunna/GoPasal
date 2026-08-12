import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/api';

export type PublicConfig = {
  platformDeliveryEnabled?: boolean;
};

export function usePublicConfig() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-config'],
    queryFn: async () => {
      const { data: res } = await apiClient.get('/config/public');
      return (res?.data ?? {}) as PublicConfig;
    },
    staleTime: 60_000,
  });

  return {
    platformDeliveryEnabled: data?.platformDeliveryEnabled === true,
    isLoading,
  };
}
