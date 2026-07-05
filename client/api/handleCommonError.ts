'use client';

import { AxiosError } from 'axios';

export const ErrorCodes = {
  BAD_REQUEST: 1002,
  UNAUTHORIZED: 1003,
  USER_INCORRECT_PASSWORD: 1006,
  USER_INVALID_STATUS: 1007,
  OTP_INVALID: 1008,
  OTP_EXPIRED: 1009,
  INVALID_REFRESH_TOKEN: 1010,
  INVALID_ACCESS_TOKEN: 1011,
  EXPIRED_ACCESS_TOKEN: 1012,
  EXPIRED_REFRESH_TOKEN: 1013,
  FORBIDDEN: 1004,
  USER_NOT_ALLOWED: 1018,
  NOT_FOUND: 1001,
  USER_NOT_FOUND: 1017,
  SESSION_NOT_FOUND: 1023,
  BANK_ACCOUNT_NOT_FOUND: 1031,
  LINKED_BANK_ACCOUNT_NOT_FOUND: 1028,
  WALLET_NOT_FOUND: 1042,
  TRANSFER_NOT_FOUND: 1043,
  SYSTEM_ACCOUNT_NOT_FOUND: 1041,
  LEDGER_ACCOUNT_NOT_FOUND: 1040,
  USER_ALREADY_EXIST: 1016,
  LINKED_BANK_ACCOUNT_EXIST: 1029,
  PASSWORD_NOT_MATCH: 1019,
  USER_NOT_ACTIVE: 1020,
  USER_SUSPENDED: 1021,
  USER_LOCKED: 1022,
  USER_DELETED: 1024,
  SESSION_EXPIRED: 1025,
  SESSION_REVOKED: 1026,
  TRANSACTION_PIN_LOCKED: 1014,
  TRANSACTION_PIN_INCORRECT: 1015,
  TRANSACTION_PIN_INVALID: 1044,
  MAX_LINKED_BANK_ACCOUNT: 1030,
  BANK_ACCOUNT_LOCKED: 1032,
  BANK_ACCOUNT_NOT_ALLOWED: 1033,
  BALANCE_NOT_ENOUGH: 1034,
  TRANSACTION_INVALID_STATUS: 1035,
  TRANSFER_AMOUNT_INVALID: 1036,
  JOURNAL_ENTRY_MUST_HAVE_TWO: 1037,
  JOURNAL_ENTRY_INVALID: 1038,
  JOURNAL_ENTRY_DEBIT_CREDIT_MUST_BE_EQUAL: 1039,
  COMMON_ERROR: 1000,
  INTERNAL_ERROR: 1005,
  TRANSFER_TO_BANK_ACCOUNT_ERROR: 1045,
  WITHDRAWAL_TO_BANK_ACCOUNT_ERROR: 1046,
} as const;

export const ErrorMessages: Record<number, string> = {
  1002: 'Yêu cầu không hợp lệ.',
  1003: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
  1006: 'Mật khẩu không chính xác.',
  1007: 'Trạng thái người dùng không hợp lệ.',
  1008: 'Mã OTP không chính xác.',
  1009: 'Mã OTP đã hết hạn.',
  1010: 'Token làm mới không hợp lệ.',
  1011: 'Token truy cập không hợp lệ.',
  1012: 'Token truy cập đã hết hạn.',
  1013: 'Token làm mới đã hết hạn.',
  1004: 'Bạn không có quyền thực hiện hành động này.',
  1018: 'Người dùng không được phép truy cập.',
  1001: 'Không tìm thấy dữ liệu yêu cầu.',
  1017: 'Không tìm thấy tài khoản người dùng.',
  1023: 'Không tìm thấy phiên làm việc.',
  1031: 'Không tìm thấy tài khoản ngân hàng.',
  1028: 'Không tìm thấy liên kết ngân hàng.',
  1042: 'Không tìm thấy ví.',
  1043: 'Không tìm thấy giao dịch chuyển tiền.',
  1041: 'Không tìm thấy tài khoản hệ thống.',
  1040: 'Không tìm thấy tài khoản sổ cái.',
  1016: 'Email đăng ký đã tồn tại trên hệ thống.',
  1029: 'Tài khoản ngân hàng đã được liên kết.',
  1019: 'Mật khẩu xác nhận không khớp.',
  1020: 'Tài khoản chưa được kích hoạt.',
  1021: 'Tài khoản đã bị tạm khóa.',
  1022: 'Tài khoản của bạn đã bị khóa.',
  1024: 'Tài khoản đã bị xóa.',
  1025: 'Phiên đăng nhập đã hết hạn.',
  1026: 'Phiên đăng nhập đã bị thu hồi.',
  1014: 'Mã PIN giao dịch đã bị khóa do nhập sai nhiều lần.',
  1015: 'Mã PIN giao dịch không chính xác.',
  1044: 'Mã PIN giao dịch không hợp lệ.',
  1030: 'Bạn đã đạt số lượng liên kết ngân hàng tối đa (tối đa 5 tài khoản).',
  1032: 'Tài khoản ngân hàng đã bị khóa.',
  1033: 'Tài khoản ngân hàng không được chấp nhận.',
  1034: 'Số dư tài khoản không đủ để thực hiện giao dịch.',
  1035: 'Trạng thái giao dịch không hợp lệ.',
  1036: 'Số tiền giao dịch không hợp lệ.',
  1037: 'Bút toán sổ cái không đầy đủ.',
  1038: 'Bút toán không hợp lệ.',
  1039: 'Bút toán ghi nợ và ghi có không cân bằng.',
  1000: 'Có lỗi xảy ra, vui lòng thử lại sau.',
  1005: 'Hệ thống gặp sự cố, vui lòng thử lại sau.',
  1045: 'Chuyển tiền tới ngân hàng thất bại.',
  1046: 'Rút tiền từ ngân hàng thất bại.',
};

export interface AppApiError extends Error {
  code: number;
  status: number;
  userMessage: string;
}

export function getErrorMessage(error: any): string {
  if (error && typeof error === 'object') {
    // If it's a wrapped AppApiError
    if ('userMessage' in error) {
      return error.userMessage;
    }

    // Axios Error
    const axiosError = error as AxiosError<{ code?: number; msg?: string; status?: number }>;
    if (axiosError.isAxiosError && axiosError.response?.data) {
      const data = axiosError.response.data;
      if (data && typeof data === 'object') {
        const code = data.code;
        if (code !== undefined && code in ErrorMessages) {
          return ErrorMessages[code];
        }
        if (data.msg) {
          return data.msg;
        }
      }
    }
  }
  return 'Có lỗi xảy ra, vui lòng thử lại sau.';
}

export async function handleCommonError<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error: any) {
    // Wrap the error with a userMessage property
    const userMessage = getErrorMessage(error);
    const apiError = error as AppApiError;
    apiError.userMessage = userMessage;

    const axiosError = error as AxiosError<{ code?: number; status?: number }>;
    if (axiosError.isAxiosError && axiosError.response?.data) {
      apiError.code = axiosError.response.data.code ?? 1000;
      apiError.status = axiosError.response.status ?? 500;
    } else {
      apiError.code = 1000;
      apiError.status = 500;
    }

    throw apiError;
  }
}
