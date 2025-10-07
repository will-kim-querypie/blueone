'use client';
import { useState } from 'react';
import { Button, Table } from 'antd';
import Linkify from 'linkify-react';
import { AddNotice } from '@/features/contractor/notice/add';
import { useFetchNotices } from '@/features/contractor/notice/list';
import { useFetchSubcontractors } from '@/features/contractor/subcontractor/list';
import { DateRange, Notice } from '@/shared/api/types';
import dayjs from '@/shared/lib/utils/dayjs';
import { LoadingPanel } from '@/shared/ui/components/loading-panel';
import createColumns from './columns';
import ConfirmationStatusModal from './confirmation-status-modal.component';
import CustomRangePicker from './custom-range-picker.component';

export default function NoticesManagementPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getInitialDateRange);

  const { data: notices = [], isPending } = useFetchNotices(dateRange);
  const { data: subcontractors = [] } = useFetchSubcontractors();

  const [confirmationModal, setConfirmationModal] = useState<{
    visible: boolean;
    notice: Notice | null;
  }>({
    visible: false,
    notice: null,
  });

  const handleConfirmationClick = (notice: Notice) => {
    setConfirmationModal({
      visible: true,
      notice,
    });
  };

  const handleModalClose = () => {
    setConfirmationModal({
      visible: false,
      notice: null,
    });
  };

  const columns = createColumns({
    totalUsers: subcontractors.length,
    onConfirmationClick: handleConfirmationClick,
  });

  if (isPending) {
    return <LoadingPanel />;
  }
  return (
    <div className="max-w-screen-lg">
      <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
        <CustomRangePicker dateRange={dateRange} setDateRange={setDateRange} />
        <AddNotice
          trigger={({ openModal, isPending }) => (
            <Button type="default" onClick={openModal} loading={isPending}>
              등록
            </Button>
          )}
        />
      </div>
      <Table
        rowKey={notice => notice.id}
        dataSource={notices}
        columns={columns}
        rowClassName="cursor-pointer"
        expandable={{
          expandedRowRender: notice => (
            <Linkify tagName="pre" className="px-2.5 whitespace-pre-wrap break-words font-[inherit]">
              {notice.content}
            </Linkify>
          ),
          expandRowByClick: true,
          showExpandColumn: false,
        }}
        pagination={{ position: ['bottomLeft'] }}
        size="middle"
        bordered
      />

      {confirmationModal.notice && (
        <ConfirmationStatusModal
          visible={confirmationModal.visible}
          onClose={handleModalClose}
          confirmedUserIds={confirmationModal.notice.confirmedUserIds || []}
        />
      )}
    </div>
  );
}

function getInitialDateRange(): DateRange {
  const today = dayjs();
  return {
    startDate: today.subtract(7, 'days').format('YYYY-MM-DD'),
    endDate: today.format('YYYY-MM-DD'),
  };
}
