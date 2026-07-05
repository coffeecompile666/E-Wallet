package service

import (
	"app/identity/model"
	notifModel "app/notification/model"
	"app/shared"

	"gorm.io/gorm"
)

type Channel string

const (
	Email Channel = "email"
	App   Channel = "app"
)

type NotificationService struct {
	mail *mailService
	db   *gorm.DB
}

func NewNotificationService(db *gorm.DB) *NotificationService {
	return &NotificationService{
		mail: newMailService(),
		db:   db,
	}
}

func (n *NotificationService) SendRegisterOTP(to, name, otp string) error {
	data := newOTPTemplateData(name, otp, model.OTPExpiredMinutes)
	body, err := n.mail.injectMailTemplate("otp_register.html", data)
	if err != nil {
		return shared.ErrInternal
	}
	return n.mail.send(to, "Xác nhận đăng ký tài khoản E-Wallet", body)
}

func (n *NotificationService) SendForgotPasswordOTP(to, name, otp string) error {
	data := newOTPTemplateData(name, otp, model.OTPExpiredMinutes)
	body, err := n.mail.injectMailTemplate("otp_forgot_password.html", data)
	if err != nil {
		return shared.ErrInternal
	}
	return n.mail.send(to, "Yêu cầu đặt lại mật khẩu E-Wallet", body)
}

func (n *NotificationService) SendSetTxPinOTP(to, name, otp string) error {
	data := newOTPTemplateData(name, otp, model.OTPExpiredMinutes)
	body, err := n.mail.injectMailTemplate("otp_set_txpin.html", data)
	if err != nil {
		return shared.ErrInternal
	}
	return n.mail.send(to, "Thiết lập mã PIN giao dịch E-Wallet", body)
}

func (n *NotificationService) SendAppNotification(userID uint, content string) error {
	if err := n.db.Create(&notifModel.Notification{UserID: userID, Content: content}).Error; err != nil {
		return shared.ErrInternal
	}
	return nil
}
