import request from './request';
import { handleCommonError } from './handleCommonError';
import {
  AddLinkedBankAccountRequest,
  LinkedBankAccount,
  ResponseWrapper,
} from './types';

export const getLinkedBankAccounts = (): Promise<ResponseWrapper<LinkedBankAccount[]>> => {
  return handleCommonError(
    request.get<ResponseWrapper<LinkedBankAccount[]>>('/payment').then((res) => res.data)
  );
};

export const addLinkedBankAccount = (data: AddLinkedBankAccountRequest): Promise<void> => {
  return handleCommonError(
    request.post('/payment', data).then(() => undefined)
  );
};

export const removeLinkedBankAccount = (id: number): Promise<void> => {
  return handleCommonError(
    request.delete(`/payment/${id}`).then(() => undefined)
  );
};
