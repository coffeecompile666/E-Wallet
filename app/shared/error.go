package shared

type Error struct {
	Code   int    `json:"code"`
	Status int    `json:"status"`
	Msg    string `json:"msg"`
}

func (e Error) Error() string {
	return e.Msg
}

var (
	ErrBadRequest                         = Error{1002, 400, "bad request"}
	ErrUnauthorized                       = Error{1003, 401, "unauthorized"}
	ErrUserIncorrectPassword              = Error{1006, 401, "user incorrect password"}
	ErrUserInvalidStatus                  = Error{1007, 401, "user invalid status"}
	ErrOTPInvalid                         = Error{1008, 401, "otp invalid"}
	ErrOTPExpired                         = Error{1009, 401, "otp expired"}
	ErrInvalidRefreshToken                = Error{1010, 401, "invalid refresh token"}
	ErrInvalidAccessToken                 = Error{1011, 401, "invalid access token"}
	ErrExpiredAccessToken                 = Error{1012, 401, "expired access token"}
	ErrExpiredRefreshToken                = Error{1013, 401, "expired refresh token"}
	ErrForbidden                          = Error{1004, 403, "forbidden"}
	ErrUserNotAllowed                     = Error{1018, 403, "user not allowed"}
	ErrNotFound                           = Error{1001, 404, "not found"}
	ErrUserNotFound                       = Error{1017, 404, "user not found"}
	ErrSessionNotFound                    = Error{1023, 404, "session not found"}
	ErrBankAccountNotFound                = Error{1031, 404, "bank account not found"}
	ErrLinkedBankAccountNotFound          = Error{1028, 404, "linked bank account not found"}
	ErrWalletNotFound                     = Error{1042, 404, "wallet not found"}
	ErrTransferNotFound                   = Error{1043, 404, "transfer not found"}
	ErrSystemAccountNotFound              = Error{1041, 404, "system account not found"}
	ErrLedgerAccountNotFound              = Error{1040, 404, "ledger account not found"}
	ErrUserAlreadyExist                   = Error{1016, 409, "user already exist"}
	ErrLinkedBankAccountExist             = Error{1029, 409, "linked bank account already exist"}
	ErrPasswordNotMatch                   = Error{1019, 422, "password not match"}
	ErrUserNotActive                      = Error{1020, 422, "user not active"}
	ErrUserSuspended                      = Error{1021, 422, "user suspended"}
	ErrUserLocked                         = Error{1022, 422, "user locked"}
	ErrUserDeleted                        = Error{1024, 422, "user deleted"}
	ErrSessionExpired                     = Error{1025, 422, "session expired"}
	ErrSessionRevoked                     = Error{1026, 422, "session revoked"}
	ErrTransactionPinLocked               = Error{1014, 422, "transaction pin locked"}
	ErrTransactionPinIncorrect            = Error{1015, 422, "transaction pin incorrect"}
	ErrTransactionPinInvalid              = Error{1044, 422, "transaction pin invalid"}
	ErrMaxLinkedBankAccount               = Error{1030, 422, "max linked bank account reached"}
	ErrBankAccountLocked                  = Error{1032, 422, "bank account locked"}
	ErrBankAccountNotAllowed              = Error{1033, 422, "bank account not allowed"}
	ErrBalanceNotEnough                   = Error{1034, 422, "balance not enough"}
	ErrTransactionInvalidStatus           = Error{1035, 422, "transaction invalid status"}
	ErrTransferAmountInvalid              = Error{1036, 422, "transfer amount invalid"}
	ErrJournalEntryMustHaveTwo            = Error{1037, 422, "journal entry must have two ledger entries"}
	ErrJournalEntryInvalid                = Error{1038, 422, "journal entry invalid"}
	ErrJournalEntryDebitCreditMustBeEqual = Error{1039, 422, "journal entry debit and credit must be equal"}
	ErrCommon                             = Error{1000, 500, "common error"}
	ErrInternal                           = Error{1005, 500, "internal error"}
	ErrTransferToBankAccount              = Error{1045, 502, "transfer to bank account error"}
	ErrWithdrawalToBankAccount            = Error{1046, 502, "withdrawal to bank account error"}
	ErrTransactionPINNotSet               = Error{1047, 502, "transaction pin not set"}
	ErrCannotTransferToSelf               = Error{1048, 502, "cannot transfer to self"}
	ErrMerchantKeyRotate                  = Error{1049, 502, "merchant key rotate error"}
	ErrMerchantNotAllowed                 = Error{1050, 502, "merchant not allowed"}
	ErrMerchantNotFound                   = Error{1051, 502, "merchant not found"}
	ErrMerchantInvalidPublicKey           = Error{1052, 502, "merchant invalid public key"}
	ErrMerchantInvalidSignature           = Error{1053, 502, "merchant invalid signature"}
	ErrMerchantOrderInvalidStatus         = Error{1054, 502, "merchant order invalid status"}
)
