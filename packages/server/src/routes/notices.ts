import express from 'express';
import { Op } from 'sequelize';
import type {
  CreateNoticeRequestBody,
  UpdateNoticeRequestBody,
  DatePickQuery,
  QueryTypedRequest,
  NoticeWithConfirmedUsers,
  NoticeDtoForContractor,
  NoticeDtoForSubcontractor,
} from 'typings';
import { isContractor, isLoggedIn } from '@/middlewares';
import { Notice, NoticeConfirmation, User } from '@/models';
import dayjs from '@/utils/dayjs';

const router = express.Router();

/**
 * 공지사항 목록 가져오기 (관리자 전용)
 */
router.get('/', isLoggedIn, isContractor, async (req: QueryTypedRequest<DatePickQuery>, res, next) => {
  const today = dayjs();
  const { startDate = today, endDate = today } = req.query;

  const gt = dayjs(startDate).startOf('day').toISOString();
  const lt = dayjs(endDate).endOf('day').toISOString();

  try {
    const noticeList = await Notice.findAll({
      where: {
        createdAt: {
          [Op.gt]: gt,
          [Op.lt]: lt,
        },
      },
      include: [
        {
          model: User,
          as: 'confirmedUsers',
          attributes: ['id'],
          through: { attributes: [] },
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const unwrapConfirmedUserID = (notice: Notice) => {
      const noticeData = notice.get({ plain: true }) as NoticeWithConfirmedUsers;
      const { confirmedUsers, ...noticeWithoutConfirmedUsers } = noticeData;
      const confirmedUserIds = (confirmedUsers || []).map(user => user.id);

      const result: NoticeDtoForContractor = {
        ...noticeWithoutConfirmedUsers,
        confirmedUserIds,
      };
      return result;
    };

    const response = noticeList.map(unwrapConfirmedUserID);

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

/**
 * 공지사항 작성
 */
router.post('/', isLoggedIn, isContractor, async (req, res, next) => {
  const { title, content, startDate, endDate }: CreateNoticeRequestBody = req.body;

  try {
    const notice = await Notice.create({
      title,
      content,
      startDate,
      endDate,
      userId: req.user?.id,
    });

    res.status(201).json(notice.get());
  } catch (err) {
    next(err);
  }
});

/**
 * 활성화된 공지사항 목록 가져오기
 */
router.get('/activation', isLoggedIn, async (req, res, next) => {
  const today = dayjs().format('YYYY-MM-DD');
  const currentUserId = req.user?.id || 0;

  try {
    const activatedNoticeList = await Notice.findAll({
      where: {
        [Op.and]: {
          startDate: {
            [Op.lte]: today,
          },
          endDate: {
            [Op.gte]: today,
          },
        },
      },
      include: [
        {
          model: User,
          as: 'confirmedUsers',
          attributes: ['id'],
          through: { attributes: [] },
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const setIsConfirmedField = (notice: Notice) => {
      const noticeData = notice.get({ plain: true }) as NoticeWithConfirmedUsers;
      const { confirmedUsers, ...noticeWithoutConfirmedUsers } = noticeData;
      const confirmedUserIds = (confirmedUsers || []).map(user => user.id);

      const result: NoticeDtoForSubcontractor = {
        ...noticeWithoutConfirmedUsers,
        isConfirmed: confirmedUserIds.includes(currentUserId),
      };
      return result;
    };

    const response = activatedNoticeList.map(setIsConfirmedField);

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

/**
 * 공지사항 가져오기
 */
router.get('/:noticeId', isLoggedIn, async (req, res, next) => {
  const { noticeId } = req.params;

  try {
    const notice = await Notice.findByPk(noticeId);

    if (!notice) {
      res.status(404).json({
        message: `id ${noticeId} 공지사항을 찾을 수 없습니다`,
      });
      return;
    }

    res.status(200).json(notice.get());
  } catch (err) {
    next(err);
  }
});

/**
 * 공지사항 수정
 */
router.put('/:noticeId', isLoggedIn, isContractor, async (req, res, next) => {
  const { noticeId } = req.params;
  const { title, content, startDate, endDate }: UpdateNoticeRequestBody = req.body;

  try {
    const notice = await Notice.findByPk(noticeId);

    if (!notice) {
      res.status(404).json({
        message: `id ${noticeId} 공지사항을 찾을 수 없습니다`,
      });
      return;
    }

    notice.title = title;
    notice.content = content;
    notice.startDate = startDate;
    notice.endDate = endDate;

    await notice.save();
    res.status(200).json(notice.get());
  } catch (err) {
    next(err);
  }
});

/**
 * 공지사항 삭제
 */
router.delete('/:noticeId', isLoggedIn, isContractor, async (req, res, next) => {
  const { noticeId } = req.params;

  try {
    const notice = await Notice.findByPk(noticeId);

    if (!notice) {
      res.status(404).json({
        message: `id ${noticeId} 공지사항을 찾을 수 없습니다`,
      });
      return;
    }

    await notice.destroy();
    res.status(200).json(notice.get());
  } catch (err) {
    next(err);
  }
});

/**
 * 공지사항 확인
 */
router.post('/:noticeId/confirm', isLoggedIn, async (req, res, next) => {
  const { noticeId } = req.params;
  const userId = req.user?.id;

  try {
    // 공지사항 존재 여부 확인
    const notice = await Notice.findByPk(noticeId);

    if (!notice) {
      res.status(404).json({
        message: `id ${noticeId} 공지사항을 찾을 수 없습니다`,
      });
      return;
    }

    // 이미 확인했는지 체크
    const existingConfirmation = await NoticeConfirmation.findOne({
      where: {
        noticeId: Number(noticeId),
        userId,
      },
    });

    if (existingConfirmation) {
      res.status(200).json({
        message: '이미 확인한 공지사항입니다',
        confirmation: existingConfirmation.get(),
      });
      return;
    }

    // 확인 레코드 생성
    const confirmation = await NoticeConfirmation.create({
      noticeId: Number(noticeId),
      userId,
    });

    res.status(201).json({
      message: '공지사항을 확인했습니다',
      confirmation: confirmation.get(),
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

export default router;
