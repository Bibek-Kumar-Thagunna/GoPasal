import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './api-client';

interface SubmitReviewData {
  orderId: string;
  productId: string;
  storeId: string;
  rating: number;
  comment?: string;
}

export const useSubmitReview = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubmitReviewData) => {
      const { data: res } = await apiClient.post('/reviews', data);
      return res;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries after a review is securely submitted
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['pendingReviews'] });
      qc.invalidateQueries({ queryKey: ['store', variables.storeId, 'reviews'] });
    },
  });
};

export const usePendingReviews = () => {
  return useMutation({
    mutationFn: async () => {
      // Custom endpoint built in Phase 2
      const response = await apiClient.get('/reviews/pending');
      return response.data?.data || [];
    }
  });
};
