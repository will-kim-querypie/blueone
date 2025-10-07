import { Singleton } from '@/shared/lib/decorators/singleton';
import HTTPClient from '../client/client';
import {
  GetListRequest,
  GetListResponse,
  NoticesClient,
  AddRequest,
  AddResponse,
  GetRequest,
  GetResponse,
  EditRequest,
  EditResponse,
  RemoveRequest,
  RemoveResponse,
  GetActiveListResponse,
  ConfirmRequest,
  ConfirmResponse,
} from '../types/notices';

@Singleton
class NoticesService extends HTTPClient implements NoticesClient {
  private ROUTE = 'notices';

  public getList = (request: GetListRequest) => {
    return this.client.get<GetListResponse>(`${this.ROUTE}`, {
      params: request,
    });
  };

  public add = (request: AddRequest) => {
    return this.client.post<AddResponse>(`${this.ROUTE}`, request);
  };

  public get = ({ noticeId }: GetRequest) => {
    return this.client.get<GetResponse>(`${this.ROUTE}/${noticeId}`);
  };

  public edit = ({ noticeId, ...request }: EditRequest) => {
    return this.client.put<EditResponse>(`${this.ROUTE}/${noticeId}`, request);
  };

  public remove = ({ noticeId }: RemoveRequest) => {
    return this.client.delete<RemoveResponse>(`${this.ROUTE}/${noticeId}`);
  };

  public getActiveList = () => {
    return this.client.get<GetActiveListResponse>(`${this.ROUTE}/activation`);
  };

  public confirm = ({ noticeId }: ConfirmRequest) => {
    return this.client.post<ConfirmResponse>(`${this.ROUTE}/${noticeId}/confirm`);
  };
}

const instance = new NoticesService();
export default instance;
