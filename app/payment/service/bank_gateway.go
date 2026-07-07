package service

import (
	"app/payment/event"
	"app/payment/model"
	"app/shared"
	"app/shared/eventbus"
	"app/shared/logger"
	"errors"
	"time"

	"gorm.io/gorm"
)

type GatewayService struct {
	DB  *gorm.DB
	Bus eventbus.EventBus
}

func NewGatewayService(db *gorm.DB, bus eventbus.EventBus) *GatewayService {
	return &GatewayService{DB: db, Bus: bus}
}

type BankTransferCommand struct {
	TransferID uint
	Name       string
	Bank       string
	Number     string
	Amount     uint
	Note       string
}

type WithdrawalCommand struct {
	TransferID uint
	Amount     uint
	AccountID  uint
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
	g.Bus.Publish(event.BankTransferSucceed{TransferID: data.TransferID, Status: model.SUCCESS})
	return nil
}

func (g *GatewayService) WithdrawalAccount(data WithdrawalCommand) error {
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

		g.Bus.Publish(event.BankWithdrawalSucceed{TransferID: data.TransferID, Status: model.SUCCESS})
		return nil
	})

	if err != nil {
		return err
	}

	return nil
}

func (g *GatewayService) GetAccountByID(tx *gorm.DB, id uint) (*model.LinkedBankAccount, error) {
	var account model.LinkedBankAccount
	if err := tx.First(&account, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared.ErrNotFound
		}
		return nil, shared.ErrCommon
	}
	return &account, nil
}

func (g *GatewayService) verifyBankAccount() error {
	return nil
}
