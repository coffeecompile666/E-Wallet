package event

type UserRegistered struct {
	UserID   uint
	UserName string
	Email    string
	OTP      string
}

type UserForgotPasswordRequested struct {
	UserName string
	Email    string
	EmailOTP string
}

type UserSetTXPINRequested struct {
	UserName string
	Email    string
	OTP      string
}

type UserSignupSuccess struct {
	UserID uint
	Email  string
}
