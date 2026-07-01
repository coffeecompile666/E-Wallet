package service

import (
	"app/messages"
	"app/payment/model"
	"app/shared"
	"app/shared/logger"
	"time"

	"gorm.io/gorm"
)

type GatewayService struct {
	DB  *gorm.DB
	Bus *messages.MessageBus
}

func NewGatewayService(db *gorm.DB, bus *messages.MessageBus) *GatewayService {
	return &GatewayService{DB: db, Bus: bus}
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
	Status     model.PaymentStatus
}

func (b BankTransferSucceed) Name() string {
	return "bank_transfer_succeed"
}

type BankWithdrawalSucceed struct {
	TransferID uint
	Status     model.PaymentStatus
}

func (b BankWithdrawalSucceed) Name() string {
	return "bank_withdrawal_succeed"
}

func (g *GatewayService) TransferToAccount(data BankTransferCommand) error {
	if err := g.verifyBankAccount(); err != nil {
		return err
	}

	var payment *model.Payment

	err := g.DB.Transaction(func(tx *gorm.DB) error {
		payment = model.NewPayment(data.Amount, data.TransferID, model.IN)

		if err := tx.Create(payment).Error; err != nil {
			return shared.ErrTransferToBankAccount
		}

		// wait 1s and do nothing
		time.Sleep(1 * time.Second)
		// pretend transfer to bank success
		logger.Log.Info("transfer to bank successfully", "bankTransferData", data)

		payment.Status = model.SUCCESS
		if err := tx.Save(payment).Error; err != nil {
			return shared.ErrTransferToBankAccount
		}

		return nil
	})

	if err != nil {
		return err
	}

	// send event to message bus
	g.Bus.Dispatch(BankTransferSucceed{TransferID: payment.TransferID, Status: model.SUCCESS})
	return nil
}

func (g *GatewayService) WithdrawalAccount(data BankTransferCommand) error {
	if err := g.verifyBankAccount(); err != nil {
		return err
	}

	var payment *model.Payment

	err := g.DB.Transaction(func(tx *gorm.DB) error {
		payment = model.NewPayment(data.Amount, data.TransferID, model.OUT)
		if err := tx.Create(payment).Error; err != nil {
			return shared.ErrWithdrawalToBankAccount
		}

		// wait 1s and do nothing
		time.Sleep(1 * time.Second)
		logger.Log.Info("withdrawal from bank successfully", "bankTransferData", data)

		payment.Status = model.SUCCESS
		if err := tx.Save(payment).Error; err != nil {
			return shared.ErrWithdrawalToBankAccount
		}

		g.Bus.Dispatch(BankWithdrawalSucceed{TransferID: payment.TransferID, Status: model.SUCCESS})
		return nil
	})

	if err != nil {
		return err
	}

	return nil
}

func (g *GatewayService) verifyBankAccount() error {
	return nil
}
