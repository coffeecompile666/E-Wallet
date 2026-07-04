package model

import (
	model2 "app/identity/model"
	"app/shared"

	"gorm.io/gorm"
)

type txType string

const (
	DEPOSIT          txType = "DEPOSIT"
	WITHDRAWAL       txType = "WITHDRAWAL"
	TRANSFER_TO_USER txType = "TRANSFER_TO_USER"
	TRANSFER_OUT     txType = "TRANSFER_OUT"
)

type status string

const (
	PENDING   status = "PENDING"
	COMPLETED status = "COMPLETED"
	FAILED    status = "FAILED"
)

type Transfer struct {
	gorm.Model

	OwnerID  uint        `gorm:"not null"`
	Amount   uint        `gorm:"not null"`
	Type     txType      `gorm:"not null"`
	Status   status      `gorm:"not null"`
	WalletID uint        `gorm:"not null"`
	Wallet   Wallet      `gorm:"foreignkey:WalletID"`
	Owner    model2.User `gorm:"foreignKey:OwnerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func NewTransfer(amount uint, ownerID uint, walletID uint, _type txType) *Transfer {
	return &Transfer{
		Amount:   amount,
		Type:     _type,
		Status:   PENDING,
		OwnerID:  ownerID,
		WalletID: walletID,
	}
}

func (t *Transfer) SetStatusCompleted() error {
	if t.Status != PENDING {
		return shared.ErrTransactionInvalidStatus
	}
	t.Status = COMPLETED
	return nil
}

func (t *Transfer) IsComplete() bool {
	return t.Status == COMPLETED || t.Status == FAILED
}
