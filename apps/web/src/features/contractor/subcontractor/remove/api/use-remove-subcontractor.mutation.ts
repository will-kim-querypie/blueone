import { AxiosError } from 'axios';
import { QueryKeys } from '@/shared/api/query-keys';
import { UsersService } from '@/shared/api/services';
import { APIError } from '@/shared/api/types';
import { RemoveRequest, RemoveResponse } from '@/shared/api/types/users';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function useRemoveSubcontractor() {
  const queryClient = useQueryClient();

  return useMutation<RemoveResponse, AxiosError<APIError>, RemoveRequest>({
    mutationFn: UsersService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.Subcontractors],
      });
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.Notices],
      });
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.ActiveNotices],
      });
    },
  });
}
