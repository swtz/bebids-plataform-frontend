import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workTimeUserApi } from '@/api/workTime.api';
import { endpoints } from '@/api/endpoints';
import type { CreateWorkTimeInput } from '@/schemas/workTime.schema';

/** PUT /work-time-user/:id — cria/substitui o horário individual do usuário. */
export function useSetWorkTimeToUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, dto }: { userId: string; dto: CreateWorkTimeInput }) =>
      workTimeUserApi.setToUser(userId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.workTime.base] });
      queryClient.invalidateQueries({ queryKey: [endpoints.user.base] });
    },
  });
}

/** PUT /work-time-user/shared/:userId/:workTimeId — atribui um horário já existente. */
export function useSetSharedWorkTimeToUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, workTimeId }: { userId: string; workTimeId: string }) =>
      workTimeUserApi.setSharedToUser(userId, workTimeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.workTime.base] });
      queryClient.invalidateQueries({ queryKey: [endpoints.user.base] });
    },
  });
}
