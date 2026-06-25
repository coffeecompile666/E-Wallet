package model

import (
	model2 "app/identity/model"

	"gorm.io/gorm"
)

type Wallet struct {
	gorm.Model

	OwnerID    uint        `gorm:"not null;uniqueIndex"`
	Owner      model2.User `gorm:"foreignKey:OwnerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Balance    int64       `gorm:"not null;default:0"`
	AmountLock int64       `gorm:"not null;default:0"`
}
