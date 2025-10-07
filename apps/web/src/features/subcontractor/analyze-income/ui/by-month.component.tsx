import { Skeleton, Typography } from 'antd';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import dayjs from 'dayjs';
import { Bar } from 'react-chartjs-2';
import { Empty } from '@/shared/ui/components/empty';
import theme from '@/shared/ui/foundation/theme';
import useAnalyzeIncome from '../api/use-analyze-income.query';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AnalyzeByMonth({ chartHeight }: { chartHeight: number }) {
  const { data: analysis } = useAnalyzeIncome({ by: 'month' });

  const chartData: ChartData<'bar', number[], string> = {
    labels: Object.keys(analysis ?? {}).map(month => `${month}월`),
    datasets: [
      {
        label: '지수합계',
        data: Object.values(analysis ?? {}),
        backgroundColor: theme.colors.primary,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const thisMonth = dayjs().month() + 1; // dayjs month is 0~11

  if (!analysis) {
    return <Skeleton />;
  }
  if (!chartData.labels?.length) {
    return <Empty description="올해 완료된 업무가 아직 없어요 :)" />;
  }
  return (
    <>
      <header className="mt-4 mb-6">
        <Typography.Text className="text-sm mb-2.5 text-gray-400 block">
          ※ 익일입고는 확인 시점으로 정산됩니다.
        </Typography.Text>
        {thisMonth !== 0 && (
          <Typography.Text className="block">지난 달 지수 합계: {analysis[`${thisMonth - 1}`]}</Typography.Text>
        )}
        <Typography.Title level={3} className="text-white text-xl">
          이번 달 지수 합계: {analysis[`${thisMonth}`]}
        </Typography.Title>
      </header>

      <Bar data={chartData} options={options} height={chartHeight} />
    </>
  );
}
