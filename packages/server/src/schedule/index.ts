import schedule from 'node-schedule-tz';
import { Op } from 'sequelize';
import { Work } from '@/models';
import sequelize from '@/models/_sequelize';
import { checkSystemHealth } from '@/services';
import dayjs from '@/utils/dayjs';
import logger from '@/utils/logger';
import omit from '@/utils/omit';

const jobs = [
  {
    name: 'Adjust booking deadline',
    cron: '30 0 0/1 * * ?', // 매 시간 30초에
    timezone: 'Asia/Seoul',
    callback: async () => {
      const hourStart = dayjs().startOf('hour');
      const hourEnd = dayjs().endOf('hour');

      try {
        const recentBookingWorks = await Work.findAll({
          where: {
            bookingDate: {
              [Op.and]: {
                [Op.gte]: hourStart.toISOString(),
                [Op.lte]: hourEnd.toISOString(),
              },
            },
          },
        });

        const transaction = await sequelize.transaction();
        try {
          for (const bookingWork of recentBookingWorks) {
            const newWorkInfo = omit(bookingWork.get(), 'id', 'bookingDate', 'createdAt', 'updatedAt');
            await Work.create(newWorkInfo, { transaction });
            await bookingWork.destroy({ transaction });
          }
          await transaction.commit();
        } catch (err) {
          await transaction.rollback();
          throw err;
        }
      } catch (err) {
        logger.error(err);
      }
    },
    logging: true,
  },
  ...(process.env.NODE_ENV === 'production'
    ? [
        {
          name: 'System health check',
          cron: '0 */5 * * * *', // 5분마다
          timezone: 'Asia/Seoul',
          callback: checkSystemHealth,
          logging: false,
        },
      ]
    : []),
];

export default function runJobs() {
  jobs.forEach(({ name, cron, timezone, callback, logging }) => {
    schedule.scheduleJob(name, cron, timezone, async () => {
      if (logging) logger.info(`[Run job] ${name}`);
      await callback();
    });
  });
}
