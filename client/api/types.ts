export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'DELETED';

export interface GormModel {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface User extends GormModel {
  Name: string;
  Email: string;
  Status: UserStatus;
}

export type SupportedBanks = 'VCB' | 'TCB' | 'BIDV' | 'ACB' | 'MB' | 'TPB' | 'VPB' | 'SCB';

export interface LinkedBankAccount extends GormModel {
  Name: string;
  Number: string;
  UserID: number;
  Bank: SupportedBanks;
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_TO_USER' | 'TRANSFER_OUT';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface Transfer extends GormModel {
  OwnerID: number;
  Amount: number;
  Type: TransactionType;
  Status: TransactionStatus;
  WalletID: number;
}

export interface Wallet extends GormModel {
  OwnerID: number;
  Balance: number;
  LockedAmount: number;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

// Request Types
export interface SignupRequest {
  email: string;
}

export interface VerifyOTPRequest {
  otp_id: number;
  otp: string;
}

export interface ConfirmSignupRequest {
  otp_id: number;
  password: string;
  password_confirmation: string;
  otp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ConfirmForgotPasswordRequest {
  otp_id: number;
  otp: string;
  password: string;
  password_confirmation: string;
}

export interface ConfirmTXPINRequest {
  OTP: string;
  OtpID: number;
  PIN: string;
}

export interface AddLinkedBankAccountRequest {
  number: string;
  name: string;
  bank: SupportedBanks;
}

export interface DepositRequest {
  wallet_id: number;
  amount: number;
  bank_account_id: number;
  tx_pin: string;
}

export interface WithdrawalRequest {
  wallet_id: number;
  amount: number;
  bank_account_id: number;
  tx_pin: string;
}

export interface TransferOutRequest {
  wallet_id: number;
  amount: number;
  bank: string;
  number: string;
  name: string;
  note: string;
  tx_pin: string;
}

export interface TransferToUserRequest {
  wallet_id: number;
  receiver_id: number;
  amount: number;
  note?: string;
  tx_pin: string;
}

export interface AppNotification {
  id: number;
  CreatedAt: string;
  Content: string;
  UserID: number;
}

// Response Wrappers
export interface ResponseWrapper<T> {
  data: T;
}

export interface CursorResponse<T> {
  start: number;
  end: number;
  items: T[];
}
