package model

import "gorm.io/gorm"

type LinkedBankAccount struct {
	gorm.Model

	Name   string `gorm:"type:varchar(20);not null"`
	Number string `gorm:"type:varchar(20);not null"`
}
