import { Divider, Select, Tooltip } from 'antd';
import { Me } from '@/entities/me';
import { useFetchSubcontractors } from '@/features/contractor/subcontractor/list';
import type { User } from '@/shared/api/types';
import processPhoneNumber from '@/shared/lib/utils/process-phone-number';
import { WarningOutlined } from '@ant-design/icons';

type Props = {
  value: User['id'] | undefined;
  onChange: (value: User['id'] | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
};

export default function SubcontractorSelector({ value, onChange, disabled = false, className, placeholder }: Props) {
  const { data: subcontractors, isPending } = useFetchSubcontractors();

  const notFound = (() => {
    if (!value || isPending) {
      // NOTE: value가 undefined로 타이핑 되어있지만, 비어있을 때 실제 값은 null이라 undefined 동등비교로 체크하면 안됩니다
      return false;
    }
    return !!subcontractors?.every((subcontractor) => subcontractor.id !== value);
  })();

  const handleClear = () => {
    onChange(undefined);
  };

  return (
    <Select<User['id']>
      value={value}
      onSelect={onChange}
      placeholder={notFound ? '(삭제된 기사가 배정되어 있습니다)' : placeholder}
      status={notFound ? 'error' : undefined}
      onClear={handleClear}
      showSearch
      allowClear
      optionFilterProp="children"
      loading={isPending}
      disabled={disabled}
      className={className}
    >
      {subcontractors?.map((subcontractor) => {
        const insuranceInfo = Me.insuranceInfo(subcontractor);

        return (
          <Select.Option key={subcontractor.id} value={subcontractor.id} className="text-center">
            {insuranceInfo.state === 'nearExpiration' && (
              <>
                <Tooltip title={`보험 일자 만료 ${insuranceInfo.from}`}>
                  <WarningOutlined className="text-yellow-500" />
                </Tooltip>
                <Divider type="vertical" />
              </>
            )}
            {insuranceInfo.state === 'expired' && (
              <>
                <Tooltip title={`보험 일자 만료됨`}>
                  <WarningOutlined className="text-red-500" />
                </Tooltip>
                <Divider type="vertical" />
              </>
            )}

            {subcontractor.UserInfo.realname}
            <Divider type="vertical" />
            {processPhoneNumber(subcontractor.phoneNumber)}
          </Select.Option>
        );
      })}
    </Select>
  );
}
