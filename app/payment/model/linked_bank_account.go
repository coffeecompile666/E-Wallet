package model

import (
	"app/identity/model"

	"gorm.io/gorm"
)

type LinkedBankAccount struct {
	gorm.Model

	Name   string `gorm:"type:varchar(20);not null"`
	Number string `gorm:"type:varchar(20);not null"`

	UserID uint       `gorm:"not null;index"`
	User   model.User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

	Bank SupportedBanks `gorm:"type:varchar(20);not null"`
}
