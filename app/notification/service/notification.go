package service

import (
	"app/identity/model"
	notifModel "app/notification/model"
	"app/shared"
	model2 "app/wallet/model"
	"app/wallet/service"
	"fmt"

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

func (n *NotificationService) NotifyDepositSuccess(e service.DepositSuccess) error {
	transfer, err := n.getTransferByID(e.TransferID)
	if err != nil {
		return shared.ErrInternal
	}

	msg := fmt.Sprintf("Giao dịch nạp tiền thành công. Số tiền: %d", transfer.Amount)
	if err := n.sendAppNotification(transfer.OwnerID, msg); err != nil {
		return shared.ErrInternal
	}

	return nil
}

func (n *NotificationService) NotifyWithdrawalSuccess(e service.WithdrawalSuccess) error {
	transfer, err := n.getTransferByID(e.TransferID)
	if err != nil {
		return shared.ErrInternal
	}

	msg := fmt.Sprintf("Giao dịch rút tiền thành công. Số tiền: %d", transfer.Amount)
	if err := n.sendAppNotification(transfer.OwnerID, msg); err != nil {
		return shared.ErrInternal
	}

	return nil
}

func (n *NotificationService) NotifyTransferOutSuccess(e service.TransferOutSuccess) error {
	transfer, err := n.getTransferByID(e.TransferID)
	if err != nil {
		return shared.ErrInternal
	}

	msg := fmt.Sprintf("Giao dịch chuyển tiền thành công. Số tiền: %d", transfer.Amount)
	if err := n.sendAppNotification(transfer.WalletID, msg); err != nil {
		return shared.ErrInternal
	}

	return nil
}

func (n *NotificationService) NotyTransferToUserSuccess(e service.TransferToUserSuccess) error {
	transfer, err := n.getTransferByID(e.TransferID)
	if err != nil {
		return shared.ErrInternal
	}

	user, err := n.getUserByWalletID(transfer.WalletID)
	if err != nil {
		return shared.ErrInternal
	}

	receiver, err := n.getUserByWalletID(e.ReceiverWalletID)
	if err != nil {
		return shared.ErrInternal
	}

	msg := fmt.Sprintf("Chuyển tiền thành công cho %s. Số tiền: %d", receiver.Name, transfer.Amount)
	if err := n.sendAppNotification(user.ID, msg); err != nil {
		return shared.ErrInternal
	}

	msg2 := fmt.Sprintf("Bạn đã nhận được %d từ %s", transfer.Amount, user.Name)
	if err := n.sendAppNotification(receiver.ID, msg2); err != nil {
		return shared.ErrInternal
	}

	return nil
}

func (n *NotificationService) sendAppNotification(userID uint, content string) error {
	if err := n.db.Create(&notifModel.Notification{UserID: userID, Content: content}).Error; err != nil {
		return shared.ErrInternal
	}
	return nil
}

func (n *NotificationService) getTransferByID(transferID uint) (model2.Transfer, error) {
	transfer := model2.Transfer{}
	if err := n.db.First(&transfer, transferID).Error; err != nil {
		return transfer, shared.ErrInternal
	}
	return transfer, nil
}

func (n *NotificationService) getWalletByID(walletID uint) (model2.Wallet, error) {
	wallet := model2.Wallet{}
	if err := n.db.First(&wallet, walletID).Error; err != nil {
		return wallet, shared.ErrInternal
	}
	return wallet, nil
}

func (n *NotificationService) getJournalEntryByID(journalEntryID uint) (model2.JournalEntry, error) {
	journalEntry := model2.JournalEntry{}
	if err := n.db.First(&journalEntry, journalEntryID).Error; err != nil {
		return model2.JournalEntry{}, shared.ErrInternal
	}
	return journalEntry, nil
}

func (n *NotificationService) getUserByWalletID(walletID uint) (model.User, error) {
	wallet, err := n.getWalletByID(walletID)
	if err != nil {
		return model.User{}, shared.ErrInternal
	}
	user := model.User{}
	if err := n.db.First(&user, wallet.OwnerID).Error; err != nil {
		return model.User{}, shared.ErrInternal
	}
	return user, nil
}
