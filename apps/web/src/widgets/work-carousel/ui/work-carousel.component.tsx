import { ReactElement } from 'react';
import { Card, Carousel } from 'antd';
import { useNewWorkAddedAlarm } from '@/features/subcontractor/list-works';
import { Work } from '@/shared/api/types';
import { Empty } from '@/shared/ui/components/empty';
import './work-carousel.component.css';

type Props = {
  works: Work[] | undefined;
  renderItem: (work: Work) => ReactElement;
};

/**
 * NOTE: localStorage를 내부에서 사용하므로, SSR일 땐 dynamic import를 사용해야 합니다.
 * 참고로 dynamic import를 사용하면 barrel file import가 불가하니,
 * ㄴ @see https://github.com/vercel/next.js/issues/27814#issuecomment-895847214
 * 예외적으로 직접 import해서 사용해야 합니다.
 */
export default function WorkCarousel({ works, renderItem }: Props) {
  const initialSlide = Number(localStorage.getItem('currSlide'));

  const afterChange = (currSlide: number) => {
    localStorage.setItem('currSlide', currSlide.toString());
  };

  useNewWorkAddedAlarm(works);

  if (!works) {
    return <Card loading style={{ position: 'relative', top: '50%', transform: 'translateY(-50%)' }} />;
  }
  if (works.length === 0) {
    return <Empty description="아직 배정된 업무가 없어요 :)" />;
  }
  return (
    <Carousel
      dots={works.length > 1}
      infinite
      initialSlide={works[initialSlide] ? initialSlide : 0}
      afterChange={afterChange}
    >
      {works.map(renderItem)}
    </Carousel>
  );
}
