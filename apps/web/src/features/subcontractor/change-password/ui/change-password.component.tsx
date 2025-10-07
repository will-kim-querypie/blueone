import { ReactElement } from 'react';
import { Form, Input, App, Modal } from 'antd';
import { ChangePasswordRequest } from '@/shared/api/types/user';
import { useDisclosure } from '@/shared/lib/hooks/use-disclosure.hook';
import useChangePassword from '../api/use-change-password.mutation';

type TriggerProps = {
  openModal: () => void;
  isPending: boolean;
};
type Props = {
  trigger: (props: TriggerProps) => ReactElement;
};

export default function ChangePassword({ trigger }: Props) {
  const [form] = Form.useForm<ChangePasswordRequest>();
  const { message } = App.useApp();
  const { mutate: changePassword, isPending } = useChangePassword();
  const { open, onOpen, onClose } = useDisclosure({
    onClose: form.resetFields,
  });

  const onFinish = async (values: ChangePasswordRequest) => {
    changePassword(values, {
      onSuccess: () => {
        message.success('비밀번호가 변경되었어요.');
        onClose();
      },
    });
  };

  return (
    <>
      {trigger({
        openModal: onOpen,
        isPending,
      })}

      <Modal
        title="비밀번호 변경"
        open={open}
        onOk={form.submit}
        onCancel={onClose}
        okText="변경"
        cancelText="취소"
        confirmLoading={isPending}
        centered
        destroyOnClose
      >
        <Form form={form} onFinish={onFinish} validateMessages={validateMessages} size="middle" layout="vertical">
          <Form.Item
            name="password"
            label="새 비밀번호"
            rules={[{ required: true }]}
            className="mb-3 [&_label]:!text-base"
          >
            <Input.Password autoComplete="off" size="large" />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="비밀번호 확인"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_rule, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('비밀번호가 일치하지 않습니다.'));
                },
              }),
            ]}
            className="mb-3 [&_label]:!text-base"
          >
            <Input.Password size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

const validateMessages = {
  required: '필수 입력 값입니다.',
};
