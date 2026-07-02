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
	ErrCommon                    = Error{1000, 500, "common error"}
	ErrNotFound                  = Error{1001, 404, "not found"}
	ErrBadRequest                = Error{1002, 400, "bad request"}
	ErrUnauthorized              = Error{1003, 401, "unauthorized"}
	ErrForbidden                 = Error{1004, 403, "forbidden"}
	ErrInternal                  = Error{1005, 500, "internal error"}
	ErrUserIncorrectPassword     = Error{1006, 401, "user incorrect password"}
	ErrUserInvalidStatus         = Error{1007, 401, "user invalid status"}
	ErrOTPInvalid                = Error{1008, 401, "otp invalid"}
	ErrOTPExpired                = Error{1009, 401, "otp expired"}
	ErrInvalidRefreshToken       = Error{1010, 401, "invalid refresh token"}
	ErrInvalidAccessToken        = Error{1011, 401, "invalid access token"}
	ErrExpiredRefreshToken       = Error{1013, 401, "expired refresh token"}
	ErrExpiredAccessToken        = Error{1012, 401, "expired access token"}
	ErrTransactionPinLocked      = Error{1014, 401, "transaction pin locked"}
	ErrTransactionPinIncorrect   = Error{1015, 401, "transaction pin incorrect"}
	ErrTransactionPinInvalid     = Error{1015, 401, "transaction pin invalid"}
	ErrUserAlreadyExist          = Error{1016, 401, "user already exist"}
	ErrUserNotFound              = Error{1017, 401, "user not found"}
	ErrUserNotAllowed            = Error{1018, 401, "user not allowed"}
	ErrPasswordNotMatch          = Error{1019, 401, "password not match"}
	ErrUserNotActive             = Error{1020, 401, "user not active"}
	ErrUserSuspended             = Error{1020, 401, "user suspended"}
	ErrUserLocked                = Error{1021, 401, "user locked"}
	ErrUserDeleted               = Error{1022, 401, "user deleted"}
	ErrSessionNotFound           = Error{1023, 401, "session not found"}
	ErrSessionExpired            = Error{1024, 401, "session expired"}
	ErrSessionRevoked            = Error{1025, 401, "session revoked"}
	ErrTransferToBankAccount     = Error{1026, 401, "transfer to bank account error"}
	ErrWithdrawalToBankAccount   = Error{1027, 401, "withdrawal to bank account error"}
	ErrLinkedBankAccountNotFound = Error{1028, 401, "linked bank account not found"}
	ErrLinkedBankAccountExist    = Error{1029, 401, "linked bank account already exist"}
	ErrMaxLinkedBankAccount      = Error{1030, 401, "max linked bank account reached"}
	ErrBankAccountNotFound       = Error{1031, 401, "bank account not found"}
	ErrBankAccountLocked         = Error{1032, 401, "bank account locked"}
	ErrBankAccountNotAllowed     = Error{1033, 401, "bank account not allowed"}
	ErrBalanceNotEnough          = Error{1034, 401, "balance not enough"}
)
