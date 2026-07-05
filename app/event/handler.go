package event

import (
	"app/identity"
	"app/identity/dto"
	"app/messages"
	service2 "app/notification/service"
	"app/payment/model"
	"app/payment/service"
	"app/wallet"
)

type Handler struct {
	walletServices      *wallet.Wallet
	identityServices    *identity.Module
	notificationService *service2.NotificationService
	bus                 *messages.MessageBus
}

func NewHandler(walletServices *wallet.Wallet, identityServices *identity.Module, bus *messages.MessageBus, notificationService *service2.NotificationService) *Handler {
	return &Handler{walletServices: walletServices, identityServices: identityServices, notificationService: notificationService, bus: bus}
}

func (h *Handler) Register() {
	// Khi user đăng ký: tạo ví + gửi OTP xác nhận
	messages.Register(h.bus, dto.UserRegistered{}.Name(), func(e dto.UserRegistered) error {
		if err := h.walletServices.WalletHandler.HandleCreateWallet(e.UserID); err != nil {
			return err
		}
		return h.notificationService.SendRegisterOTP(e.Email, e.UserName, e.OTP)
	})

	// Khi user yêu cầu đặt lại mật khẩu: gửi OTP reset password
	messages.Register(h.bus, dto.UserForgotPasswordRequested{}.Name(), func(e dto.UserForgotPasswordRequested) error {
		return h.notificationService.SendForgotPasswordOTP(e.Email, e.UserName, e.EmailOTP)
	})

	// Khi user thiết lập Transaction PIN: gửi OTP xác nhận
	messages.Register(h.bus, dto.UserSetTXPINRequested{}.Name(), func(e dto.UserSetTXPINRequested) error {
		return h.notificationService.SendSetTxPinOTP(e.Email, e.UserName, e.OTP)
	})

	// Nạp tiền vào ví: khi ngân hàng rút tiền thành công
	messages.Register(h.bus, service.BankWithdrawalSucceed{}.Name(), func(e service.BankWithdrawalSucceed) error {
		if e.Status == model.SUCCESS {
			return h.walletServices.WalletHandler.HandleDeposit(e.TransferID)
		}
		return nil
	})

	// Rút tiền / Chuyển tiền ra ngoài: khi ngân hàng chuyển thành công
	messages.Register(h.bus, service.BankTransferSucceed{}.Name(), func(e service.BankTransferSucceed) error {
		if e.Status == model.SUCCESS {
			return h.walletServices.WalletHandler.HandleTransferOut(e.TransferID)
		}
		return nil
	})
}
