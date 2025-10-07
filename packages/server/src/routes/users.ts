import * as process from 'process';
import bcrypt from 'bcrypt';
import express from 'express';
import type { CreateUserRequestBody, UpdateUserRequestBody } from 'typings';
import { isContractor, isLoggedIn } from '@/middlewares';
import { User, UserInfo, Work, NoticeConfirmation } from '@/models';
import { withPayout } from '@/utils/calculate-payout';
import omit from '@/utils/omit';
import { getDefaultWhereParamsQueriedByWork } from '@/utils/query/work';

const router = express.Router();

/**
 * Subcontractor 리스트 가져오기
 */
router.get('/', isLoggedIn, isContractor, async (_req, res, next) => {
  try {
    const users = await User.findAll({
      where: { role: 'subcontractor' },
      attributes: {
        exclude: ['password'],
      },
      include: [UserInfo],
      order: [[UserInfo, 'realname', 'ASC']],
    });
    res.status(200).json(users.map(user => user.get()));
  } catch (err) {
    console.error(err);
    next(err);
  }
});

/**
 * Subcontractor 추가
 */
router.post('/', isLoggedIn, isContractor, async (req, res, next) => {
  const { phoneNumber, ...restUserInfo }: CreateUserRequestBody = req.body;
  const INITIAL_PASSWORD = '1234';

  try {
    const hashedPassword = await bcrypt.hash(INITIAL_PASSWORD, 10);
    const [user, isCreated] = await User.findOrCreate({
      where: { phoneNumber },
      defaults: {
        role: 'subcontractor',
        phoneNumber,
        password: hashedPassword,
        UserInfo: restUserInfo,
      },
      attributes: {
        exclude: ['password'],
      },
      include: [UserInfo],
    });

    if (!isCreated) {
      res.status(409).json({
        message: '이미 사용 중인 전화번호입니다.',
      });
      return;
    }

    res.status(201).json(omit(user.get(), 'password'));
  } catch (err) {
    next(err);
  }
});

/**
 * Contractor 추가
 */
router.post('/contractor', async (req, res, next) => {
  try {
    const { contractorCreateKey, phoneNumber, password } = req.body;

    if (contractorCreateKey !== process.env.CONTRACTOR_CREATE_KEY) {
      res.status(403).json({
        message: '생성 키가 일치하지 않습니다.',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [contractor, isCreated] = await User.findOrCreate({
      where: { phoneNumber },
      defaults: {
        role: 'contractor',
        phoneNumber,
        password: hashedPassword,
      },
    });

    if (!isCreated) {
      res.status(409).json({
        message: '이미 사용 중인 전화번호입니다.',
      });
      return;
    }

    res.status(201).json(omit(contractor.get(), 'password'));
  } catch (err) {
    next(err);
  }
});

/**
 * 특정 유저 가져오기
 */
router.get('/:userId', isLoggedIn, isContractor, async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findOne({
      where: { id: userId },
      attributes: {
        exclude: ['password'],
      },
      include: [UserInfo],
    });

    if (!user) {
      res.status(404).json({
        message: '존재하지 않는 유저입니다.',
      });
      return;
    }

    res.status(200).json(user.get());
  } catch (err) {
    next(err);
  }
});

/**
 * 유저 수정
 */
router.put('/:userId', isLoggedIn, isContractor, async (req, res, next) => {
  const { userId } = req.params;
  const { phoneNumber, ...restInfo }: UpdateUserRequestBody = req.body;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json({
        message: '존재하지 않는 유저입니다.',
      });
      return;
    }

    await user.update({ phoneNumber });
    await UserInfo.update(restInfo, { where: { userId } });

    const updatedUser = await User.findOne({
      where: { id: userId },
      attributes: {
        exclude: ['password'],
      },
      include: [UserInfo],
    });

    res.status(200).json(updatedUser?.get());
  } catch (err) {
    next(err);
  }
});

/**
 * 유저 삭제
 */
router.delete('/:userId', isLoggedIn, isContractor, async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findByPk(userId, {
      attributes: {
        exclude: ['password'],
      },
    });

    if (!user) {
      res.status(404).json({
        message: `id ${userId} 유저를 찾을 수 없습니다`,
      });
      return;
    }

    // 공지사항 확인 기록 삭제
    await NoticeConfirmation.destroy({
      where: { userId },
    });

    await user.destroy();
    res.status(200).json(user.get());
  } catch (err) {
    next(err);
  }
});

/**
 * 활성화된 유저 업무 가져오기
 */
router.get('/:userId/works', isLoggedIn, isContractor, async (req, res, next) => {
  const { userId } = req.params;

  try {
    const activatedWorks = await Work.findAll({
      where: {
        ...getDefaultWhereParamsQueriedByWork(),
        userId,
        endTime: null,
      },
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json(activatedWorks.map(withPayout));
  } catch (err) {
    next(err);
  }
});

export default router;
