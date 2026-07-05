package dto

type UserRegistered struct {
	UserID   uint
	UserName string
	Email    string
	OTP      string
}

func (u UserRegistered) Name() string {
	return "user.registered"
}

type UserForgotPasswordRequested struct {
	UserName string
	Email    string
	EmailOTP string
}

func (u UserForgotPasswordRequested) Name() string {
	return "user.forgot_password_requested"
}

type UserSetTXPINRequested struct {
	UserName string
	Email    string
	OTP      string
}

func (u UserSetTXPINRequested) Name() string {
	return "user.set_txpin_requested"
}
