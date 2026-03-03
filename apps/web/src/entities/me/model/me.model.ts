import { GetMyInfoResponse } from '@/shared/api/types/user';
import { ONE_DAY } from '@/shared/config/time';
import dayjs from '@/shared/lib/utils/dayjs';

export type Model = GetMyInfoResponse;

export const serviceEntry = (model: Model): string => {
  if (model.role === 'contractor') {
    return '/contractor/works';
  }

  return '/subcontractor';
};

export type InsuranceState = 'normal' | 'nearExpiration' | 'expired';
export const insuranceInfo = (model: Model) => {
  const expirationDate = dayjs(model.UserInfo?.insuranceExpirationDate); // TODO: contractor도 UserInfo 채워서 내려주기
  const now = dayjs();

  const state: InsuranceState = (() => {
    if (!now.isBefore(expirationDate, 'day')) return 'expired';
    if (expirationDate.diff(now, 'ms') < 7 * ONE_DAY) return 'nearExpiration';
    return 'normal';
  })();

  return {
    state,
    from: now.from(expirationDate),
    to: now.to(expirationDate),
  };
};
