import { Button, message } from 'antd';
import { getErrorMessageForUser } from '@/shared/api/get-error-message';
import { CheckCircleOutlined, CheckOutlined } from '@ant-design/icons';
import useConfirmNotice from '../api/use-confirm-notice.mutation';

interface ConfirmNoticeButtonProps {
  noticeId: number;
  isConfirmed?: boolean;
}

export default function ConfirmNoticeButton({ noticeId, isConfirmed }: ConfirmNoticeButtonProps) {
  const { mutate: confirmNotice, isPending } = useConfirmNotice();

  const handleConfirm = () => {
    confirmNotice(
      { noticeId },
      {
        onSuccess: data => {
          message.success(data.message || '공지사항을 확인했습니다');
        },
        onError: error => {
          message.error(getErrorMessageForUser(error));
        },
      },
    );
  };

  if (isConfirmed) {
    return (
      <Button size="large" type="default" icon={<CheckCircleOutlined />} disabled block>
        확인 완료
      </Button>
    );
  }

  return (
    <Button size="large" type="primary" icon={<CheckOutlined />} onClick={handleConfirm} loading={isPending} block>
      공지 확인
    </Button>
  );
}
