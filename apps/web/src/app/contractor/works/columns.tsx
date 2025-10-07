import { ReactNode } from 'react';
import { Button, Table, Tooltip } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { AddWork } from '@/features/contractor/work/add';
import { EditWork } from '@/features/contractor/work/edit';
import { RemoveWork } from '@/features/contractor/work/remove';
import { ItemOf, PaymentType } from '@/shared/api/types';
import { GetListResponse } from '@/shared/api/types/works';
import { ONE_DAY } from '@/shared/config/time';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';

type Item = ItemOf<GetListResponse>;

const columns: ColumnsType<Item> = [
  {
    title: '일자',
    dataIndex: 'createdAt',
    key: 'createdAt', // 컬럼 필터링 때 필요합니다
    align: 'center',
    render: (_, record) => renderDate(record.createdAt),
    sorter: {
      compare: (a, b) => +dayjs(a.createdAt).toDate() - +dayjs(b.createdAt).toDate(),
    },
    width: 75,
  },
  {
    title: '예약 일시',
    dataIndex: 'bookingDate',
    key: 'bookingDate', // 컬럼 필터링 때 필요합니다
    align: 'center',
    render: (_, record) => renderDate(record.bookingDate, true),
    sorter: {
      compare: (a, b) => +dayjs(a.bookingDate).toDate() - +dayjs(b.bookingDate).toDate(),
    },
    width: 110,
  },
  {
    title: '출발지',
    dataIndex: 'origin',
    align: 'center',
    width: 100,
    ellipsis: true,
  },
  {
    title: '경유지',
    dataIndex: 'waypoint',
    align: 'center',
    width: 100,
    ellipsis: true,
  },
  {
    title: '도착지',
    dataIndex: 'destination',
    align: 'center',
    width: 100,
    ellipsis: true,
  },
  {
    title: '차종',
    dataIndex: 'carModel',
    align: 'center',
    ellipsis: true,
    width: 100,
  },
  {
    title: '기사',
    dataIndex: 'realname',
    align: 'center',
    render: (_, record) => record.User?.UserInfo.realname,
    width: 80,
  },
  {
    title: '구간지수',
    dataIndex: 'charge',
    align: 'right',
    width: 80,
  },
  {
    title: '할인/할증',
    dataIndex: 'adjustment',
    align: 'right',
    width: 80,
  },
  {
    title: '지원',
    dataIndex: 'subsidy',
    key: 'subsidy',
    align: 'right',
    width: 80,
  },
  {
    title: '직불',
    dataIndex: `payout`,
    key: `payout-${PaymentType.DIRECT}`,
    align: 'right',
    render: (_, record) => {
      if (record.paymentType !== PaymentType.DIRECT) return;
      return record.payout;
    },
    width: 80,
  },
  {
    title: '현불',
    dataIndex: 'payout',
    key: `payout-${PaymentType.CASH}`,
    align: 'right',
    render: (_, record) => {
      if (record.paymentType !== PaymentType.CASH) return;
      return record.payout;
    },
    width: 80,
  },
  {
    title: '정산',
    dataIndex: 'fee',
    align: 'right',
    render: (_, record) => record.fee || null,
    width: 80,
  },
  {
    title: '확인',
    dataIndex: 'checkTime',
    key: 'checkTime',
    align: 'center',
    render: (_, record) => renderTime(record.checkTime, record.createdAt),
    width: 110,
  },
  {
    title: '완료',
    dataIndex: 'endTime',
    key: 'endTime',
    align: 'center',
    render: (_, record) => renderTime(record.endTime, record.createdAt),
    sorter: {
      compare: (a, b) => +!!a.endTime - +!!b.endTime,
    },
    width: 110,
  },
  {
    title: 'Addition',
    key: 'action',
    align: 'center',
    render: (_, record) => {
      if (!record.endTime) {
        return (
          <>
            {renderEditButton(record)}
            {renderAddButton(record)}
            {renderRemoveButton(record)}
          </>
        );
      }

      if (isCompletedIn24Hours(record.endTime)) {
        return (
          <>
            {renderEditButton(record)}
            {renderAddButton(record)}
          </>
        );
      }

      return renderAddButton(record);
    },
    width: 90,
  },
  Table.EXPAND_COLUMN, // remark(비고) 컬럼
];

export default columns;

function renderAddButton(record: Item) {
  return (
    <AddWork
      initialValues={record}
      trigger={({ openModal, isPending }) => (
        <Tooltip title="추가">
          <Button type="text" size="small" icon={<PlusOutlined />} onClick={openModal} loading={isPending} />
        </Tooltip>
      )}
    />
  );
}

function renderEditButton(record: Item) {
  return (
    <EditWork
      id={record.id}
      initialValues={record}
      completed={!!record.endTime}
      trigger={({ openModal, isPending }) => (
        <Tooltip title="수정">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={openModal} loading={isPending} />
        </Tooltip>
      )}
    />
  );
}

function renderRemoveButton(record: Item) {
  return (
    <RemoveWork
      id={record.id}
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
    />
  );
}

function isCompletedIn24Hours(endTime: string) {
  return dayjs().diff(endTime).valueOf() < ONE_DAY;
}

function renderTime(targetTime: string | undefined, createdAt: Item['createdAt']): ReactNode {
  if (!targetTime) return null;

  const day = dayjs(targetTime);
  const isCreatedDay = day.startOf('day').isSame(dayjs(createdAt).startOf('day'));

  return <span className="whitespace-nowrap">{day.format(isCreatedDay ? 'HH:mm' : 'MM/DD_HH:mm')}</span>;
}

function renderDate(targetDate?: string, withTime?: boolean): ReactNode {
  if (!targetDate) return null;

  const day = dayjs(targetDate);
  const inThisYear = day.year() === dayjs().year();

  const formatFront = inThisYear ? 'MM/DD' : 'YYYY/MM/DD';
  const formatBack = withTime ? ' HH:00' : '';

  return <span className="whitespace-nowrap">{day.format(formatFront + formatBack)}</span>;
}
