package model

import "gorm.io/gorm"

type AccountType string

const (
	Liability AccountType = "liability"
	Asset     AccountType = "asset"
)

type Account struct {
	gorm.Model

	WalletID *uint
	Wallet   *Wallet     `gorm:"foreignKey:WalletID"`
	Code     string      `gorm:"uniqueIndex;not null"`
	Type     AccountType `gorm:"not null"`
}
