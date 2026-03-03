import { ReactNode } from 'react';
import { Avatar, Button, List, Tooltip, Typography } from 'antd';
import { Me } from '@/entities/me';
import { EditSubcontractor } from '@/features/contractor/subcontractor/edit';
import { RemoveSubcontractor } from '@/features/contractor/subcontractor/remove';
import { ItemOf } from '@/shared/api/types';
import { GetListResponse } from '@/shared/api/types/users';
import cn from '@/shared/lib/utils/cn';
import processPhoneNumber from '@/shared/lib/utils/process-phone-number';
import { DeleteOutlined, EditOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons';

type Props = {
  contractor: ItemOf<GetListResponse>;
};

export default function ListItem({ contractor }: Props) {
  const insuranceInfo = Me.insuranceInfo(contractor);

  return (
    <List.Item
      className="hover:bg-gray-50 focus:bg-gray-50"
      actions={[
        <EditSubcontractor
          key={`edit_${contractor.id}`}
          id={contractor.id}
          initialValues={{
            phoneNumber: contractor.phoneNumber,
            realname: contractor.UserInfo.realname,
            dateOfBirth: contractor.UserInfo.dateOfBirth,
            licenseNumber: contractor.UserInfo.licenseNumber,
            licenseType: contractor.UserInfo.licenseType,
            insuranceNumber: contractor.UserInfo.insuranceNumber,
            insuranceExpirationDate: contractor.UserInfo.insuranceExpirationDate,
          }}
          trigger={({ openModal, isPending }) => (
            <Tooltip title="수정">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={openModal} loading={isPending} />
            </Tooltip>
          )}
        />,
        <RemoveSubcontractor
          key={`remove_${contractor.id}`}
          id={contractor.id}
          trigger={({ openPopConfirm, isPending }) => (
            <Tooltip title="삭제">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                className="!text-red-500"
                onClick={openPopConfirm}
                loading={isPending}
              />
            </Tooltip>
          )}
        />,
      ]}
    >
      <List.Item.Meta
        avatar={
          <Avatar
            icon={<UserOutlined />}
            className={cn({
              'bg-gray-300': insuranceInfo.state === 'normal',
              'bg-yellow-500': insuranceInfo.state === 'nearExpiration',
              'bg-red-500': insuranceInfo.state === 'expired',
            })}
          />
        }
        title={renderTitle(insuranceInfo.state, contractor.UserInfo.realname)}
        description={
          <div className={cn({ 'line-through': insuranceInfo.state === 'expired' })}>
            <Typography.Text className="block">{processPhoneNumber(contractor.phoneNumber)}</Typography.Text>
            <Typography.Text className="block">
              {insuranceInfo.state === 'expired'
                ? '보험이 만료되었습니다'
                : `보험 만료일: ${contractor.UserInfo.insuranceExpirationDate} (${insuranceInfo.to})`}
            </Typography.Text>
          </div>
        }
      />
    </List.Item>
  );
}

function renderTitle(state: Me.InsuranceState, realname: string): ReactNode {
  switch (state) {
    case 'normal':
      return <Typography.Text>{realname}</Typography.Text>;
    case 'nearExpiration':
      return (
        <>
          <Typography.Text>{realname}</Typography.Text>&nbsp;
          <Tooltip title="보험 만료가 얼마 남지 않았습니다.">
            <WarningOutlined className="align-text-top text-yellow-500" />
          </Tooltip>
        </>
      );
    case 'expired':
      return (
        <>
          <Typography.Text className="line-through">{realname}</Typography.Text>&nbsp;
          <Tooltip title="보험이 만료되었습니다.">
            <WarningOutlined className="align-text-top text-red-500" />
          </Tooltip>
        </>
      );
    default:
      return <Typography.Text>{realname}</Typography.Text>;
  }
}
