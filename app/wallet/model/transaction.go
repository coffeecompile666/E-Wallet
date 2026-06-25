package model

import (
	model2 "app/identity/model"

	"gorm.io/gorm"
)

type Transaction struct {
	gorm.Model

	OwnerID   uint `gorm:"not null"`
	Amount    int64
	Direction int64
	Status    int64
	Owner     model2.User `gorm:"foreignKey:OwnerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func NewTransaction(amount int64, direction int64, status int64, ownerID uint) *Transaction {
	return &Transaction{
		Amount:    amount,
		Direction: direction,
		Status:    status,
		OwnerID:   ownerID,
	}
}
