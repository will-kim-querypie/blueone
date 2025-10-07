'use client';
import { Avatar, Button, Card, List, Typography } from 'antd';
import { useFetchMe } from '@/entities/me';
import { useSignOut } from '@/features/sign-out';
import { ChangePassword } from '@/features/subcontractor/change-password';
import processPhoneNumber from '@/shared/lib/utils/process-phone-number';
import { PhoneOutlined, UserOutlined } from '@ant-design/icons';
import './page.css';

export default function SettingPage() {
  const { mutate: signOut } = useSignOut();

  return (
    <List
      header={<SettingsHeader />}
      footer={<SettingsFooter />}
      dataSource={[
        <ChangePassword
          key="change-password"
          trigger={({ openModal, isPending }) => (
            <Button type="text" onClick={openModal} className="text-start p-0" block loading={isPending}>
              비밀번호 변경
            </Button>
          )}
        />,
        <Button key="sign-out" type="text" onClick={() => signOut()} block>
          로그아웃
        </Button>,
      ]}
      renderItem={item => <List.Item>{item}</List.Item>}
      className="p-[unset]"
    />
  );
}

function SettingsHeader() {
  const { data: me } = useFetchMe();

  if (!me) return null;
  return (
    <Card>
      <Card.Meta
        avatar={<Avatar icon={<UserOutlined />} size={54} className="bg-primary" />}
        title={
          <Typography.Text className="text-lg mt-0.5 block">{me.UserInfo?.realname || 'Contractor'}</Typography.Text>
        }
        description={
          <>
            <PhoneOutlined className="transform rotate-90 mr-1 text-lg" />
            <Typography.Text>{processPhoneNumber(me.phoneNumber)}</Typography.Text>
          </>
        }
      />
    </Card>
  );
}

function SettingsFooter() {
  return (
    <footer className="text-center py-4 text-sm text-gray-500">
      Copyright ©2014 BLUEONE, Inc. All rights reserved.
    </footer>
  );
}
