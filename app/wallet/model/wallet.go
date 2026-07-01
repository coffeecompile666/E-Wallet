package model

import (
	identityModel "app/identity/model"

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
