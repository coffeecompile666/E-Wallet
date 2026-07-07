package event

import "app/payment/model"

type BankTransferSucceed struct {
	TransferID uint
	Status     model.PaymentStatus
}

type BankWithdrawalSucceed struct {
	TransferID uint
	Status     model.PaymentStatus
}
