package event

import (
	event2 "app/identity/event"
	"app/identity/model"
	notifModel "app/notification/model"
	service2 "app/notification/service"
	"app/shared"
	"app/shared/eventbus"
	"app/shared/logger"
	"app/wallet/event"
	model2 "app/wallet/model"
	"fmt"

	"gorm.io/gorm"
)

type Handler struct {
	mail *service2.MailService
	db   *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{
		mail: service2.NewMailService(),
		db:   db,
	}
}

func (n *Handler) SendRegisterOTP(e eventbus.Event) error {
	name := e.(event2.UserRegistered).UserName
	otpCode := e.(event2.UserRegistered).OTP
	to := e.(event2.UserRegistered).Email

	data := service2.NewOTPTemplateData(name, otpCode, model.OTPExpiredMinutes)
	body, err := n.mail.InjectMailTemplate("otp_register.html", data)
	if err != nil {
		return err
	}
	return n.mail.Send(to, "Xác nhận đăng ký tài khoản E-Wallet", body)
}

func (n *Handler) SendForgotPasswordOTP(e eventbus.Event) error {
	name := e.(event2.UserForgotPasswordRequested).UserName
	otp := e.(event2.UserForgotPasswordRequested).EmailOTP
	to := e.(event2.UserForgotPasswordRequested).Email

	data := service2.NewOTPTemplateData(name, otp, model.OTPExpiredMinutes)
	body, err := n.mail.InjectMailTemplate("otp_forgot_password.html", data)
	if err != nil {
		return err
	}
	logger.Log.Info("OTP sent", "otp", otp)
	return n.mail.Send(to, "Yêu cầu đặt lại mật khẩu E-Wallet", body)
}

func (n *Handler) SendSetTxPinOTP(e eventbus.Event) error {
	name := e.(event2.UserSetTXPINRequested).UserName
	otp := e.(event2.UserSetTXPINRequested).OTP
	to := e.(event2.UserSetTXPINRequested).Email

	data := service2.NewOTPTemplateData(name, otp, model.OTPExpiredMinutes)
	body, err := n.mail.InjectMailTemplate("otp_set_txpin.html", data)
	if err != nil {
		return err
	}
	return n.mail.Send(to, "Thiết lập mã PIN giao dịch E-Wallet", body)
}

func (n *Handler) NotifyDepositSuccess(e eventbus.Event) error {
	transferID := e.(event.DepositSuccess).TransferID

	transfer, err := n.getTransferByID(transferID)
	if err != nil {
		return err
	}

	msg := fmt.Sprintf("Giao dịch nạp tiền thành công. Số tiền: %d", transfer.Amount)
	if err := n.sendAppNotification(transfer.OwnerID, msg); err != nil {
		return shared.ErrInternal
	}

	return nil
}

func (n *Handler) NotifyWithdrawalSuccess(e eventbus.Event) error {
	transferID := e.(event.WithdrawalSuccess).TransferID

	transfer, err := n.getTransferByID(transferID)
	if err != nil {
		return err
	}

	msg := fmt.Sprintf("Giao dịch rút tiền thành công. Số tiền: %d", transfer.Amount)
	if err := n.sendAppNotification(transfer.OwnerID, msg); err != nil {
		return shared.ErrInternal
	}

	return nil
}

func (n *Handler) NotifyTransferOutSuccess(e eventbus.Event) error {
	transferID := e.(event.TransferOutSuccess).TransferID

	transfer, err := n.getTransferByID(transferID)
	if err != nil {
		return err
	}

	msg := fmt.Sprintf("Giao dịch chuyển tiền thành công. Số tiền: %d", transfer.Amount)
	if err := n.sendAppNotification(transfer.WalletID, msg); err != nil {
		return shared.ErrInternal
	}

	return nil
}

func (n *Handler) NotyTransferToUserSuccess(e eventbus.Event) error {
	transferID := e.(event.TransferToUserSuccess).TransferID
	receiverWalletID := e.(event.TransferToUserSuccess).ReceiverWalletID

	transfer, err := n.getTransferByID(transferID)
	if err != nil {
		return shared.ErrInternal
	}

	user, err := n.getUserByWalletID(transfer.WalletID)
	if err != nil {
		return shared.ErrInternal
	}

	receiver, err := n.getUserByWalletID(receiverWalletID)
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

func (n *Handler) sendAppNotification(userID uint, content string) error {
	if err := n.db.Create(&notifModel.Notification{UserID: userID, Content: content}).Error; err != nil {
		return shared.ErrInternal
	}
	return nil
}

func (n *Handler) getTransferByID(transferID uint) (model2.Transfer, error) {
	transfer := model2.Transfer{}
	if err := n.db.First(&transfer, transferID).Error; err != nil {
		return transfer, shared.ErrInternal
	}
	return transfer, nil
}

func (n *Handler) getWalletByID(walletID uint) (model2.Wallet, error) {
	wallet := model2.Wallet{}
	if err := n.db.First(&wallet, walletID).Error; err != nil {
		return wallet, shared.ErrInternal
	}
	return wallet, nil
}

func (n *Handler) getJournalEntryByID(journalEntryID uint) (model2.JournalEntry, error) {
	journalEntry := model2.JournalEntry{}
	if err := n.db.First(&journalEntry, journalEntryID).Error; err != nil {
		return model2.JournalEntry{}, shared.ErrInternal
	}
	return journalEntry, nil
}

func (n *Handler) getUserByWalletID(walletID uint) (model.User, error) {
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
