import type { Request } from 'express';
import * as core from 'express-serve-static-core';
import type { User, UserInfo, Work, Notice } from '@/models';

export type QueryTypedRequest<QT = core.Query> = Request<
  core.ParamsDictionary,
  unknown,
  unknown,
  QT,
  Record<string, unknown>
>;

type ISODateString = string;
export type DatePickQuery = {
  startDate: ISODateString;
  endDate: ISODateString;
};

export type CreateUserRequestBody = Pick<User, 'phoneNumber'> &
  Pick<
    UserInfo,
    'realname' | 'dateOfBirth' | 'licenseNumber' | 'licenseType' | 'insuranceNumber' | 'insuranceExpirationDate'
  >;
export type UpdateUserRequestBody = CreateUserRequestBody;

export type WorkState = 'checked' | 'completed';
export type CreateWorkRequestBody = { userId: User['id'] | null } & Pick<
  Work,
  | 'origin'
  | 'waypoint'
  | 'destination'
  | 'carModel'
  | 'charge'
  | 'adjustment'
  | 'subsidy'
  | 'paymentType'
  | 'remark'
  | 'bookingDate'
>;
export type UpdateWorkRequestBody = CreateWorkRequestBody;

export type CreateNoticeRequestBody = Pick<Notice, 'title' | 'content' | 'startDate' | 'endDate'>;
export type UpdateNoticeRequestBody = CreateNoticeRequestBody;

type NoticeData = {
  id: number;
  userId: number;
  title: string;
  content: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type NoticeWithConfirmedUsers = NoticeData & {
  confirmedUsers?: Array<{ id: number }>;
};

export type NoticeDtoForContractor = NoticeData & {
  confirmedUserIds: number[];
};

export type NoticeDtoForSubcontractor = NoticeData & {
  isConfirmed: boolean;
};

export enum PaymentType {
  DIRECT = 'DIRECT',
  CASH = 'CASH',
}
