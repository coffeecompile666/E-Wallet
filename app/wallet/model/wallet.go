package model

import (
	identityModel "app/identity/model"
	"app/shared"

	"gorm.io/gorm"
)

type Wallet struct {
	gorm.Model

	OwnerID      uint               `gorm:"not null;uniqueIndex"`
	Owner        identityModel.User `gorm:"foreignKey:OwnerID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	Balance      int64              `gorm:"not null;default:0"`
	LockedAmount int64              `gorm:"not null;default:0"`
}

func NewWallet(userID uint) *Wallet {
	return &Wallet{
		OwnerID:      userID,
		Balance:      0,
		LockedAmount: 0,
	}
}

func (w *Wallet) GetBalance() int64 {
	return w.Balance
}

func (w *Wallet) Debit(amount int64) error {
	if amount > w.Balance {
		return shared.ErrBalanceNotEnough
	}
	w.Balance -= amount

	return nil
}

func (w *Wallet) Credit(amount int64) {
	w.Balance += amount
}

func (w *Wallet) Lock(amount int64) error {
	if amount > w.Balance {
		return shared.ErrBalanceNotEnough
	}

	w.LockedAmount += amount
	w.Balance -= amount

	return nil
}

func (w *Wallet) Unlock(amount int64) error {
	if amount > w.LockedAmount {
		return shared.ErrBalanceNotEnough
	}

	w.LockedAmount -= amount
	w.Balance += amount

	return nil
}
