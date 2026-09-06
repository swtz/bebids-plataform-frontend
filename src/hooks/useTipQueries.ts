import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tipApi } from '@/api/tip.api';
import { endpoints } from '@/api/endpoints';

export function useRemoveTip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tipApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.delivery.base] });
      queryClient.invalidateQueries({ queryKey: [endpoints.payout.base] });
    },
  });
}
