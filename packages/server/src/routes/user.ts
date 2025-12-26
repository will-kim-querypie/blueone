import bcrypt from 'bcrypt';
import express from 'express';
import passport from 'passport';
import { Op } from 'sequelize';
import type { DatePickQuery, QueryTypedRequest } from 'typings';
import { isLoggedIn, isNotLoggedIn, loginLimiter } from '@/middlewares';
import { User, UserInfo, Work } from '@/models';
import addFloats from '@/utils/add-floats';
import calculatePayout, { withPayout } from '@/utils/calculate-payout';
import dayjs from '@/utils/dayjs';
import { getDefaultWhereParamsQueriedByWork } from '@/utils/query/work';

const router = express.Router();

/**
 * 내 정보 가져오기
 */
router.get('/', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { id: req.user?.id },
      attributes: {
        exclude: ['password'],
      },
      include: [
        {
          model: UserInfo,
          attributes: {
            include: ['realname', 'licenseType', 'insuranceExpirationDate'],
          },
        },
      ],
    });

    if (!user) {
      res.status(404).json({
        message: '세션 정보로 유저를 찾을 수 없습니다.',
      });
      return;
    }

    res.status(200).json(user.get());
  } catch (err) {
    next(err);
  }
});

/**
 * 로그인
 */
router.post('/sign-in', loginLimiter, isNotLoggedIn, (req, res, next) => {
  passport.authenticate(
    'local',
    (serverError: unknown, user: User, clientError: unknown) => {
      if (serverError) {
        console.error('serverError', serverError);
        next(serverError);
        return;
      }

      if (clientError) {
        res.status(403).json(clientError);
        return;
      }

      return req.login(user, async (loginError) => {
        if (loginError) {
          console.error('loginError', loginError);
          return next(loginError);
        }
        const fullUser = await User.findOne({
          where: { id: user.id },
          attributes: {
            exclude: ['password'],
          },
          include: [
            {
              model: UserInfo,
              attributes: {
                include: ['realname', 'licenseType', 'insuranceExpirationDate'],
              },
            },
          ],
        });
        return res.status(200).json(fullUser?.get());
      });
    },
  )(req, res, next);
});

/**
 * 로그아웃
 */
router.post('/sign-out', isLoggedIn, (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('로그아웃 중 에러', err);
    }
  });
  req.session.destroy((err) => {
    if (err) {
      console.error('세션 파괴 중 에러', err);
    }
    res.clearCookie('connect.sid');
    res.sendStatus(204);
  });
});

/**
 * 비밀번호 수정
 */
router.post('/password', isLoggedIn, async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await User.update(
      { password: hashedPassword },
      { where: { id: req.user?.id } },
    );
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

/**
 * 3일 이내의 내 업무 리스트 가져오기 (완료 날짜가 오늘인 항목을 제외하곤 완료된 업무 미포함)
 */
router.get('/works', isLoggedIn, async (req, res, next) => {
  const today = dayjs();
  const TODAY_START = today.startOf('day').toISOString();
  const THREE_DAYS_AGO_START = today
    .startOf('day')
    .subtract(3, 'days')
    .toISOString();

  try {
    const works = await Work.findAll({
      where: {
        ...getDefaultWhereParamsQueriedByWork(),
        userId: req.user?.id,
        [Op.or]: [
          {
            createdAt: {
              [Op.gt]: TODAY_START,
            },
          },
          {
            createdAt: {
              [Op.gt]: THREE_DAYS_AGO_START,
              [Op.lt]: TODAY_START,
            },
            endTime: {
              [Op.or]: [
                null,
                {
                  [Op.gt]: TODAY_START,
                },
              ],
            },
          },
        ],
      },
      order: [
        ['endTime', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });

    res.status(200).json(works.map(withPayout));
  } catch (err) {
    next(err);
  }
});

/**
 * 지정한 기간 내 완료된 내 업무 목록 가져오기
 */
router.get(
  '/works/complete',
  isLoggedIn,
  async (req: QueryTypedRequest<DatePickQuery>, res, next) => {
    const today = dayjs();
    const { startDate = today, endDate = today } = req.query;

    const gt = dayjs(startDate).startOf('day').toISOString();
    const lt = dayjs(endDate).endOf('day').toISOString();

    try {
      const works = await Work.findAll({
        where: {
          ...getDefaultWhereParamsQueriedByWork(),
          userId: req.user?.id,
          endTime: {
            [Op.gt]: gt,
            [Op.lt]: lt,
            [Op.ne]: null,
          },
        },
        order: [['createdAt', 'DESC']],
      });
      res.status(200).json(works.map(withPayout));
    } catch (err) {
      console.error(err);
      next(err);
    }
  },
);

/**
 * 올해 혹은 이번달 내 업무의 최종지수 통계 가져오기
 */
router.get(
  '/works/analysis',
  isLoggedIn,
  async (req: QueryTypedRequest<{ by: 'day' | 'month' }>, res, next) => {
    const { by = 'day' } = req.query;

    const today = dayjs();
    const dayjsUnit = {
      day: 'month',
      month: 'year',
    } as const;
    const firstDateOfRange = today.startOf(dayjsUnit[by]).toISOString();

    try {
      const completedWorks = await Work.findAll({
        where: {
          ...getDefaultWhereParamsQueriedByWork(),
          userId: req.user?.id,
          endTime: {
            [Op.ne]: null,
          },
          createdAt: {
            [Op.gt]: firstDateOfRange,
          },
        },
        attributes: ['charge', 'subsidy', 'checkTime'],
        order: [['createdAt', 'DESC']],
      });

      if (completedWorks.length === 0) {
        res.status(200).json([]);
        return;
      }

      const getWorksAnalysisAtThisMonth = async () => {
        const lastDayOfThisMonth = today.endOf('month').date();

        const dateMap = [...Array(lastDayOfThisMonth)].reduce<{
          [date: `${number}`]: number;
        }>((acc, _, i) => {
          acc[`${i + 1}`] = 0;
          return acc;
        }, {});

        completedWorks.forEach((work) => {
          const { payout, fee } = calculatePayout(work);
          const currDate = dayjs(work.checkTime).date();
          dateMap[`${currDate}`] = addFloats(
            dateMap[`${currDate}`],
            payout - fee,
          );
        });

        return dateMap;
      };

      const getWorksAnalysisAtThisYear = async () => {
        const monthMap = [...Array(12)].reduce<{
          [date: `${number}`]: number;
        }>((acc, _, i) => {
          acc[`${i + 1}`] = 0;
          return acc;
        }, {});

        completedWorks.forEach((work) => {
          const { payout, fee } = calculatePayout(work);
          const currMonth = dayjs(work.checkTime).month() + 1; // dayjs month is 0~11
          monthMap[`${currMonth}`] = addFloats(
            monthMap[`${currMonth}`],
            payout - fee,
          );
        });

        return monthMap;
      };

      let worksAnalysis: { [dateOrMonth: `${number}`]: number };
      switch (by) {
        case 'day':
          worksAnalysis = await getWorksAnalysisAtThisMonth();
          break;
        case 'month':
          worksAnalysis = await getWorksAnalysisAtThisYear();
          break;
        default:
          worksAnalysis = await getWorksAnalysisAtThisMonth();
          break;
      }

      res.status(200).json(worksAnalysis);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
