package model

import (
	identityModel "app/identity/model"
	"app/shared"
	"math"

	"gorm.io/gorm"
)

type Wallet struct {
	gorm.Model

	OwnerID      uint               `gorm:"not null;uniqueIndex"`
	Owner        identityModel.User `gorm:"foreignKey:OwnerID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	Balance      uint               `gorm:"not null;default:0"`
	LockedAmount uint               `gorm:"not null;default:0"`

	Account Account `gorm:"foreignKey:WalletID;references:ID"`
}

func NewWallet(userID uint) *Wallet {
	return &Wallet{
		OwnerID:      userID,
		Balance:      0,
		LockedAmount: 0,
	}
}

func (w *Wallet) GetAvailableBalance() uint {
	return w.Balance - w.LockedAmount
}

func (w *Wallet) Debit(amount uint) error {
	if err := validateAmount(amount); err != nil {
		return err
	}

	if amount > w.GetAvailableBalance() {
		return shared.ErrBalanceNotEnough
	}
	w.Balance -= amount

	return nil
}

func (w *Wallet) Credit(amount uint) error {
	if err := validateAmount(amount); err != nil {
		return err
	}

	w.Balance += amount
	return nil
}

func (w *Wallet) Lock(amount uint) error {
	if err := validateAmount(amount); err != nil {
		return err
	}

	if amount > w.GetAvailableBalance() {
		return shared.ErrBalanceNotEnough
	}

	w.LockedAmount += amount

	return nil
}

func (w *Wallet) Unlock(amount uint) error {
	if err := validateAmount(amount); err != nil {
		return err
	}

	if amount > w.LockedAmount {
		return shared.ErrBalanceNotEnough
	}

	w.LockedAmount -= amount

	return nil
}

func validateAmount(amount uint) error {
	if amount < 0 || amount > 10000000000 {
		return shared.ErrTransferAmountInvalid
	}

	if float64(amount)-math.Round(float64(amount)) > 0 {
		return shared.ErrTransferAmountInvalid
	}

	return nil
}
