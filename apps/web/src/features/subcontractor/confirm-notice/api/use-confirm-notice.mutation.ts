import { AxiosError } from 'axios';
import { QueryKeys } from '@/shared/api/query-keys';
import { NoticesService } from '@/shared/api/services';
import { APIError } from '@/shared/api/types';
import { ConfirmRequest, ConfirmResponse } from '@/shared/api/types/notices';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function useConfirmNotice() {
  const queryClient = useQueryClient();

  return useMutation<ConfirmResponse, AxiosError<APIError>, ConfirmRequest>({
    mutationFn: NoticesService.confirm,
    onSuccess: () => {
      // 공지 목록을 다시 불러와서 확인 상태 반영
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ActiveNotices] });
    },
  });
}
