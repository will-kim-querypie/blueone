import { Modal, ModalProps, Tag, Typography } from 'antd';
import { useFetchSubcontractors } from '@/features/contractor/subcontractor/list';
import { ItemOf } from '@/shared/api/types';
import { GetListResponse } from '@/shared/api/types/users';
import { LoadingPanel } from '@/shared/ui/components/loading-panel';

const { Text } = Typography;

type Subcontractor = ItemOf<GetListResponse>;

type ConfirmationStatusModalProps = {
  visible: boolean;
  onClose: () => void;
  confirmedUserIds: number[];
};

export default function ConfirmationStatusModal({ visible, onClose, confirmedUserIds }: ConfirmationStatusModalProps) {
  const { data: subcontractors, isPending } = useFetchSubcontractors();

  const modalProps: ModalProps = {
    title: '공지 확인 현황',
    open: visible,
    onCancel: onClose,
    footer: null,
    width: 500,
  };

  if (isPending) {
    return (
      <Modal {...modalProps}>
        <LoadingPanel />
      </Modal>
    );
  }

  const [confirmedUsers, unconfirmedUsers] = (subcontractors ?? []).reduce<[Subcontractor[], Subcontractor[]]>(
    (acc, user) => {
      if (confirmedUserIds.includes(user.id)) {
        acc[0].push(user);
      } else {
        acc[1].push(user);
      }
      return acc;
    },
    [[], []],
  );

  if (unconfirmedUsers.length === 0) {
    return (
      <Modal {...modalProps}>
        <Text type="secondary">모든 기사가 확인했습니다.</Text>
      </Modal>
    );
  }

  return (
    <Modal {...modalProps}>
      <div className="space-y-3 mb-4">
        <div className="text-sm text-gray-600">확인 ({confirmedUsers.length}명)</div>
        <div className="flex flex-wrap gap-1">
          {!confirmedUsers.length && '-'}
          {confirmedUsers.map(user => (
            <Tag key={user.id} className="mr-0 text-sm">
              {user.UserInfo.realname}
            </Tag>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="text-sm text-gray-600">미확인 ({unconfirmedUsers.length}명)</div>
        <div className="flex flex-wrap gap-1">
          {!unconfirmedUsers.length && '-'}
          {unconfirmedUsers.map(user => (
            <Tag key={user.id} className="mr-0 text-sm">
              {user.UserInfo.realname}
            </Tag>
          ))}
        </div>
      </div>
    </Modal>
  );
}
