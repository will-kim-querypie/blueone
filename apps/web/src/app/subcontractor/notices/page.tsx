'use client';
import { Card, List } from 'antd';
import Linkify from 'linkify-react';
import { ConfirmNoticeButton } from '@/features/subcontractor/confirm-notice';
import { useFetchActiveNotices } from '@/features/subcontractor/list-active-notices';
import { Empty } from '@/shared/ui/components/empty';

export default function NoticePage() {
  const { data: notices } = useFetchActiveNotices();

  if (!notices) {
    return <List loading />;
  }
  if (notices.length === 0) {
    return <Empty description="공지사항이 아직 등록되지 않았어요." />;
  }
  return (
    <List
      grid={{ gutter: 16, column: 1 }}
      dataSource={notices}
      renderItem={(item) => (
        <List.Item className="border-t-2 border-solid border-primary rounded-t-none">
          <Card
            title={item.title}
            classNames={{
              header: '!p-3 !min-h-[unset]',
              body: '!py-3 !px-4',
            }}
          >
            <Linkify tagName="pre" className="whitespace-pre-wrap break-words font-[inherit] mb-3">
              {item.content}
            </Linkify>
            <ConfirmNoticeButton noticeId={item.id} isConfirmed={item.isConfirmed} />
          </Card>
        </List.Item>
      )}
    />
  );
}
