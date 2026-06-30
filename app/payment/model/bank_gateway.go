package model

import (
	"app/messages"
	"app/shared"
	"app/shared/logger"
	"time"

	"gorm.io/gorm"
)

type Gateway struct {
	DB  *gorm.DB
	Bus *messages.MessageBus
}

func NewGateway(db *gorm.DB, bus *messages.MessageBus) *Gateway {
	return &Gateway{DB: db, Bus: bus}
}

type BankTransferCommand struct {
	TransferID uint
	Name       string
	Number     string
	Amount     int64
	Note       string
}

type BankTransferSucceed struct {
	TransferID uint
	Status     PaymentStatus
}

func (b BankTransferSucceed) Name() string {
	return "bank_transfer_succeed"
}

type BankWithdrawalSucceed struct {
	TransferID uint
	Status     PaymentStatus
}

func (b BankWithdrawalSucceed) Name() string {
	return "bank_withdrawal_succeed"
}

func (g *Gateway) TransferToAccount(data BankTransferCommand) error {
	if err := g.verifyBankAccount(); err != nil {
		return err
	}

	var payment *Payment

	err := g.DB.Transaction(func(tx *gorm.DB) error {
		payment = NewPayment(data.Amount, data.TransferID, IN)

		if err := tx.Create(payment).Error; err != nil {
			return shared.ErrTransferToBankAccount
		}

		// wait 1s and do nothing
		time.Sleep(1 * time.Second)
		// pretend transfer to bank success
		logger.Log.Info("transfer to bank successfully", "bankTransferData", data)

		payment.Status = SUCCESS
		if err := tx.Save(payment).Error; err != nil {
			return shared.ErrTransferToBankAccount
		}

		return nil
	})

	if err != nil {
		return err
	}

	// send event to message bus
	g.Bus.Dispatch(BankTransferSucceed{TransferID: payment.TransferID, Status: SUCCESS})
	return nil
}

func (g *Gateway) WithdrawalAccount(data BankTransferCommand) error {
	if err := g.verifyBankAccount(); err != nil {
		return err
	}

	var payment *Payment

	err := g.DB.Transaction(func(tx *gorm.DB) error {
		payment = NewPayment(data.Amount, data.TransferID, OUT)
		if err := tx.Create(payment).Error; err != nil {
			return shared.ErrWithdrawalToBankAccount
		}

		// wait 1s and do nothing
		time.Sleep(1 * time.Second)
		logger.Log.Info("withdrawal from bank successfully", "bankTransferData", data)

		payment.Status = SUCCESS
		if err := tx.Save(payment).Error; err != nil {
			return shared.ErrWithdrawalToBankAccount
		}

		g.Bus.Dispatch(BankWithdrawalSucceed{TransferID: payment.TransferID, Status: SUCCESS})
		return nil
	})

	if err != nil {
		return err
	}

	return nil
}

func (g *Gateway) verifyBankAccount() error {
	return nil
}
