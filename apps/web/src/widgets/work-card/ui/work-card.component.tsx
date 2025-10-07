import { Button, Card, Tooltip, Typography } from 'antd';
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
      className={cn('relative max-h-[70vh] overflow-auto', className)}
      actions={
        readOnly
          ? undefined
          : [
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
            ]
      }
    >
      {!!work.endTime && <WorkDoneStamp />}

      {readOnly && !!work.endTime && (
        <Typography.Text className="text-lg mb-2 block">
          <b>{dayjs(work.endTime).format('MM-DD')}</b>
        </Typography.Text>
      )}

      <div className="grid grid-cols-[max-content_1fr] gap-x-2 gap-y-1">
        <GridRow label="출발지" content={work.origin} copyable={!readOnly} />
        {!!work.waypoint && <GridRow label="경유지" content={work.waypoint} copyable={!readOnly} />}
        <GridRow label="도착지" content={work.destination} copyable={!readOnly} />
        <GridRow label="차종" content={work.carModel} />
        {!!work.remark && <GridRow label="비고" content={work.remark} />}
        <GridRow label="구간지수" content={work.charge} asterisk />
        {
          !!work.adjustment && (
            <GridRow label="할인/할증" content={work.adjustment} />
          ) /* TODO: 할인 할증 분리하고 할인만 빨간색 표시 */
        }
        {!!work.subsidy && <GridRow label="지원" content={work.subsidy} />}

        {work.paymentType === PaymentType.DIRECT && (
          <GridRow label="직불" content={work.payout} className="font-bold text-primary" />
        )}
        {work.paymentType === PaymentType.CASH && (
          <>
            <GridRow label="현불" content={work.payout} className="font-bold text-red-500" />
            <GridRow label="정산" content={work.fee} className="font-bold text-primary" />
          </>
        )}
      </div>
    </Card>
  );
}

function WorkDoneStamp() {
  return (
    <Tooltip title="완료된 업무예요.">
      <CheckCircleOutlined className="absolute top-6 right-6 text-primary text-[40px]" />
    </Tooltip>
  );
}

type GridRow = {
  label: string;
  content: string | number;
  asterisk?: boolean;
  copyable?: boolean;
  className?: string;
};
function GridRow({ label, content, asterisk, copyable, className }: GridRow) {
  return (
    <>
      <Typography.Paragraph
        className={cn(
          'text-base text-right',
          {
            'relative before:content-["*"] before:absolute before:-left-[0.2em] before:top-[0.65em] before:transform before:-translate-x-1/2 before:-translate-y-1/2':
              asterisk,
          },
          className,
        )}
      >
        {label}:
      </Typography.Paragraph>
      <Typography.Paragraph className={cn('text-base', className)} copyable={copyable}>
        {content}
      </Typography.Paragraph>
    </>
  );
}
