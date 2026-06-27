package dto

type UserRegistered struct {
	Email string
	OTP   string
}

func (u UserRegistered) Name() string {
	return "user.registered"
}

type UserForgotPasswordRequested struct {
	Email    string
	EmailOTP string
}

func (u UserForgotPasswordRequested) Name() string {
	return "user.forgot_password_requested"
}

type UserSetTXPINRequested struct {
	OTP   string
	Email string
}

func (u UserSetTXPINRequested) Name() string {
	return "user.set_txpin_requested"
}
