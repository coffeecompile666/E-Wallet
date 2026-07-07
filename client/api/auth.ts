import request from './request';
import { handleCommonError } from './handleCommonError';
import {
  SignupRequest,
  VerifyOTPRequest,
  ConfirmSignupRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ConfirmForgotPasswordRequest,
  ConfirmTXPINRequest,
  ResponseWrapper,
  TokenPair,
  User,
} from './types';

export const signup = (data: SignupRequest): Promise<ResponseWrapper<number>> => {
  return handleCommonError(
    request.post<ResponseWrapper<number>>('/signup', data).then((res) => res.data)
  );
};

export const verifyOTP = (data: VerifyOTPRequest): Promise<void> => {
  return handleCommonError(
    request.post('/verify-otp', data).then(() => undefined)
  );
};

export const confirmSignup = (data: ConfirmSignupRequest): Promise<void> => {
  return handleCommonError(
    request.post('/confirm-signup', data).then(() => undefined)
  );
};

export const signin = (data: LoginRequest): Promise<ResponseWrapper<TokenPair>> => {
  return handleCommonError(
    request.post<ResponseWrapper<TokenPair>>('/signin', data).then((res) => res.data)
  );
};

export const logout = (): Promise<void> => {
  return handleCommonError(
    request.post('/logout').then(() => undefined)
  );
};

export const forgotPassword = (data: ForgotPasswordRequest): Promise<ResponseWrapper<number>> => {
  return handleCommonError(
    request.post<ResponseWrapper<number>>('/forgot-password', data).then((res) => res.data)
  );
};

export const confirmForgotPassword = (data: ConfirmForgotPasswordRequest): Promise<void> => {
  return handleCommonError(
    request.post('/confirm-forgot-password', data).then(() => undefined)
  );
};

export const refreshToken = (): Promise<ResponseWrapper<TokenPair>> => {
  return handleCommonError(
    request.post<ResponseWrapper<TokenPair>>('/refresh-token').then((res) => res.data)
  );
};

export const createTransactionPin = (): Promise<ResponseWrapper<number>> => {
  return handleCommonError(
    request.post<ResponseWrapper<number>>('/transaction-pin').then((res) => res.data)
  );
};

export const confirmTransactionPin = (data: ConfirmTXPINRequest): Promise<void> => {
  return handleCommonError(
    request.post('/confirm-transaction-pin', data).then(() => undefined)
  );
};

export const getMe = (): Promise<ResponseWrapper<User>> => {
  return handleCommonError(
    request.get<ResponseWrapper<User>>('/me').then((res) => res.data)
  );
};
