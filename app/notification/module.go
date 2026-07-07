package notification

import (
	event3 "app/identity/event"
	event2 "app/notification/event"
	"app/shared/eventbus"
	"app/wallet/event"

	"gorm.io/gorm"
)

type Notification struct {
	DB  *gorm.DB
	Bus eventbus.EventBus
}

func NewNotification(db *gorm.DB, bus eventbus.EventBus) *Notification {
	return &Notification{
		DB:  db,
		Bus: bus,
	}
}

func (p *Notification) Init() {
	handler := event2.NewHandler(p.DB)

	p.Bus.Subscribe(event3.UserForgotPasswordRequested{}, handler.SendForgotPasswordOTP)
	p.Bus.Subscribe(event3.UserSetTXPINRequested{}, handler.SendSetTxPinOTP)
	p.Bus.Subscribe(event.DepositSuccess{}, handler.NotifyDepositSuccess)
	p.Bus.Subscribe(event.WithdrawalSuccess{}, handler.NotifyWithdrawalSuccess)
	p.Bus.Subscribe(event.TransferOutSuccess{}, handler.NotifyTransferOutSuccess)
	p.Bus.Subscribe(event.TransferToUserSuccess{}, handler.NotyTransferToUserSuccess)
}
