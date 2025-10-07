import { Button, Card, Typography } from 'antd';
import dayjs from 'dayjs';
import { CheckWork } from '@/features/subcontractor/check-work';
import { CompleteWork } from '@/features/subcontractor/complete-work';
import { PaymentType, Work } from '@/shared/api/types';
import cn from '@/shared/lib/utils/cn';
import { CheckCircleOutlined } from '@ant-design/icons';

type Props = {
  work: Work;
  readOnly?: boolean;
  className?: string;
};

export default function WorkCard({ work, readOnly = false, className }: Props) {
  return (
    <Card
      bordered={false}
      className={cn('relative max-h-[calc(100dvh-240px)] overflow-auto', className)}
      style={{ background: 'transparent' }}
      styles={{
        body: { padding: 0 },
        actions: { marginTop: 10 },
      }}
      actions={readOnly ? undefined : getWorkActions(work)}
    >
      {readOnly && !!work.endTime && (
        <Typography.Text className="text-lg mb-2 block">
          <b>{dayjs(work.endTime).format('MM-DD')}</b>
        </Typography.Text>
      )}

      <div className="border border-solid border-gray-500 rounded-sm overflow-hidden">
        <GridRow label="출발지" content={work.origin} />
        <GridRow label="경유지" content={work.waypoint || ''} />
        <GridRow label="도착지" content={work.destination} />
        <GridRow label="차종" content={work.carModel} />
        <GridRow label="비고" content={work.remark || ''} />
        <GridRow label="구간지수" content={work.charge} asterisk />
        <GridRow label="할인/할증" content={work.adjustment || ''} />
        <GridRow label="지원" content={work.subsidy || ''} />

        {work.paymentType === PaymentType.DIRECT && (
          <GridRow label="직불" content={work.payout} valueClassName="font-bold text-primary" />
        )}
        {work.paymentType === PaymentType.CASH && (
          <>
            <GridRow label="현불" content={work.payout} valueClassName="font-bold text-red-500" />
            <GridRow label="정산" content={work.fee} valueClassName="font-bold text-primary" />
          </>
        )}
      </div>
    </Card>
  );
}

function getWorkActions(work: Work) {
  // 완료된 작업이면 Done UI 표시
  if (work.endTime) {
    return [
      <div key={`done_${work.id}`} className="h-8 flex items-center justify-center gap-2">
        <CheckCircleOutlined className="text-slate-400 text-base" />
        <Typography.Text className="text-lg font-medium text-slate-400">완료된 업무</Typography.Text>
      </div>,
    ];
  }

  // 완료되지 않은 작업이면 기존 확인/완료 버튼 표시
  return [
    <CheckWork key={`check_${work.id}`} work={work}>
      {({ check, canCheck }) => (
        <Button
          type={canCheck ? 'primary' : 'text'}
          className="rounded-none"
          disabled={!canCheck}
          size="large"
          onClick={check}
          block
        >
          확인
        </Button>
      )}
    </CheckWork>,
    <CompleteWork key={`complete_${work.id}`} work={work}>
      {({ complete, canComplete }) => (
        <Button
          type={canComplete ? 'primary' : 'text'}
          className="rounded-none"
          disabled={!canComplete}
          size="large"
          onClick={complete}
          block
        >
          완료
        </Button>
      )}
    </CompleteWork>,
  ];
}

type GridRow = {
  label: string;
  content: string | number;
  asterisk?: boolean;
  valueClassName?: string;
};
function GridRow({ label, content, asterisk, valueClassName }: GridRow) {
  return (
    <div className="grid grid-cols-[1fr_1fr] border-b border-solid border-gray-500 last:border-b-0">
      <div className="text-base text-center py-1 px-3 bg-slate-900 text-white font-semibold border-r border-solid border-gray-500">
        {label}
        {asterisk && <span className="text-red-500 ml-0.5">*</span>}
      </div>
      <Typography.Paragraph className={cn('text-base text-center py-1 px-3 mb-0', valueClassName)}>
        {content}
      </Typography.Paragraph>
    </div>
  );
}
