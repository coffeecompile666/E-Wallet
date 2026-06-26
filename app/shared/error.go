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
	ErrCommon                  = Error{1000, 500, "common error"}
	ErrNotFound                = Error{1001, 404, "not found"}
	ErrBadRequest              = Error{1002, 400, "bad request"}
	ErrUnauthorized            = Error{1003, 401, "unauthorized"}
	ErrForbidden               = Error{1004, 403, "forbidden"}
	ErrInternal                = Error{1005, 500, "internal error"}
	ErrUserIncorrectPassword   = Error{1006, 401, "user incorrect password"}
	ErrUserInvalidStatus       = Error{1007, 401, "user invalid status"}
	ErrOTPInvalid              = Error{1008, 401, "otp invalid"}
	ErrOTPExpired              = Error{1009, 401, "otp expired"}
	ErrInvalidRefreshToken     = Error{1010, 401, "invalid refresh token"}
	ErrInvalidAccessToken      = Error{1011, 401, "invalid access token"}
	ErrExpiredRefreshToken     = Error{1013, 401, "expired refresh token"}
	ErrExpiredAccessToken      = Error{1012, 401, "expired access token"}
	ErrTransactionPinLocked    = Error{1014, 401, "transaction pin locked"}
	ErrTransactionPinIncorrect = Error{1015, 401, "transaction pin incorrect"}
)
