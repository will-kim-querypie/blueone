'use client';
import { Card, List, Typography } from 'antd';
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
      renderItem={item => (
        <List.Item className="border-t-2 border-solid border-primary rounded-t-none">
          <Card
            title={item.title}
            classNames={{
              header: '!p-3 !min-h-[unset]',
              body: '!py-3 !px-4',
            }}
            styles={{ header: { fontSize: '20px' } }}
          >
            <div className="mb-3 min-h-[100px]">
              <Linkify tagName="pre" className="whitespace-pre-wrap break-words font-[inherit]">
                <Typography.Text style={{ fontSize: '20px' }}>{item.content}</Typography.Text>
              </Linkify>
            </div>
            <ConfirmNoticeButton noticeId={item.id} isConfirmed={item.isConfirmed} />
          </Card>
        </List.Item>
      )}
    />
  );
}
