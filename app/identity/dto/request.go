package dto

type SignupRequest struct {
	Email string `json:"email"`
}

type VerifyOTPRequest struct {
	OtpID uint   `json:"otp_id"`
	OTP   string `json:"otp"`
}

type ConfirmSignup struct {
	OtpID                uint   `json:"otp_id"`
	Password             string `json:"password"`
	PasswordConfirmation string `json:"password_confirmation"`
	OTP                  string `json:"otp"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

type ConfirmForgotPasswordRequest struct {
	OtpID                uint   `json:"otp_id"`
	OTP                  string `json:"otp"`
	Password             string `json:"password"`
	PasswordConfirmation string `json:"password_confirmation"`
}

type ConfirmTXPINRequest struct {
	OTP   string
	OtpID uint
	PIN   string
}
