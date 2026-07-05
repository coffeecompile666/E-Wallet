import request from './request';
import { handleCommonError } from './handleCommonError';
import {
  Wallet,
  Transfer,
  DepositRequest,
  WithdrawalRequest,
  TransferOutRequest,
  ResponseWrapper,
  CursorResponse,
} from './types';

export const getWalletByID = (walletID: number): Promise<ResponseWrapper<Wallet>> => {
  return handleCommonError(
    request.get<ResponseWrapper<Wallet>>(`/wallet/${walletID}`).then((res) => res.data)
  );
};

export const getTransactions = (params: {
  wallet_id: number;
  start?: number;
  end?: number;
}): Promise<CursorResponse<Transfer>> => {
  return handleCommonError(
    request
      .get<CursorResponse<Transfer>>('/wallet/transaction', { params })
      .then((res) => res.data)
  );
};

export const deposit = (data: DepositRequest): Promise<ResponseWrapper<number>> => {
  return handleCommonError(
    request.post<ResponseWrapper<number>>('/wallet/deposit', data).then((res) => res.data)
  );
};

export const withdraw = (data: WithdrawalRequest): Promise<ResponseWrapper<number>> => {
  return handleCommonError(
    request.post<ResponseWrapper<number>>('/wallet/withdrawal', data).then((res) => res.data)
  );
};

export const transferOut = (data: TransferOutRequest): Promise<ResponseWrapper<number>> => {
  return handleCommonError(
    request.post<ResponseWrapper<number>>('/wallet/transfer-out', data).then((res) => res.data)
  );
};
