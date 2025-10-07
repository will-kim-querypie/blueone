import { EndPoint, Notice } from '@/shared/api/types';

type NoticeId = {
  noticeId: Notice['id'];
};

export type GetListRequest = EndPoint['GET /notices']['queryParams'];
export type GetListResponse = EndPoint['GET /notices']['responses']['200'];

export type AddRequest = EndPoint['POST /notices']['requestBody'];
export type AddResponse = EndPoint['POST /notices']['responses']['201'];

export type GetRequest = NoticeId;
export type GetResponse = EndPoint['GET /notices/{noticeId}']['responses']['200'];

export type EditRequest = NoticeId & EndPoint['PUT /notices/{noticeId}']['requestBody'];
export type EditResponse = EndPoint['PUT /notices/{noticeId}']['responses']['200'];

export type RemoveRequest = NoticeId;
export type RemoveResponse = EndPoint['DELETE /notices/{noticeId}']['responses']['200'];

export type GetActiveListResponse = EndPoint['GET /notices/activation']['responses']['200'];

export type ConfirmRequest = NoticeId;
export type ConfirmResponse = EndPoint['POST /notices/{noticeId}/confirm']['responses']['201'];

export interface NoticesClient {
  getList: (request: GetListRequest) => Promise<GetListResponse>;
  add: (request: AddRequest) => Promise<AddResponse>;
  get: (request: GetRequest) => Promise<GetResponse>;
  edit: (request: EditRequest) => Promise<EditResponse>;
  remove: (request: RemoveRequest) => Promise<RemoveResponse>;
  getActiveList: () => Promise<GetActiveListResponse>;
  confirm: (request: ConfirmRequest) => Promise<ConfirmResponse>;
}
