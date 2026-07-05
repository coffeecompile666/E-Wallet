package service

import "time"

// baseTemplateData chứa các field dùng chung trong mọi loại email
type baseTemplateData struct {
	AppName string
	Year    int
}

// OTPTemplateData là data cho các email gửi OTP
type OTPTemplateData struct {
	baseTemplateData
	Name          string
	OTP           string
	ExpireMinutes int
}

func newOTPTemplateData(name, otp string, expireMinutes int) OTPTemplateData {
	return OTPTemplateData{
		baseTemplateData: baseTemplateData{
			AppName: "E-Wallet",
			Year:    time.Now().Year(),
		},
		Name:          name,
		OTP:           otp,
		ExpireMinutes: expireMinutes,
	}
}
