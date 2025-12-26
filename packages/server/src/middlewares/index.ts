import type { RequestHandler, ErrorRequestHandler } from 'express';
import logger from '@/utils/logger';

export { apiLimiter, loginLimiter } from './rateLimiter';

export const isLoggedIn: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({
      message: '로그인이 필요합니다.',
    });
  }
};

export const isNotLoggedIn: RequestHandler = (req, res, next) => {
  if (req.isUnauthenticated()) {
    next();
  } else {
    res.status(403).json({
      message: '로그인하지 않은 사용자만 접근 가능합니다.',
    });
  }
};

export const isContractor: RequestHandler = (req, res, next) => {
  if (req.user?.role === 'contractor') {
    next();
  } else {
    res.status(403).json({
      message: 'Contractor만 접근 가능합니다.',
    });
  }
};

export const errorLogger: ErrorRequestHandler = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`);
  next(err);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, _) => {
  res.status(500).json({
    message: '500 Server Error',
  });
};
