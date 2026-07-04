package model

import "gorm.io/gorm"

type AccountType string

const (
	Liability AccountType = "liability"
	Asset     AccountType = "asset"
)

type SystemAccountCode string

const (
	SystemBankAssetCode SystemAccountCode = "system_bank_asset"
)

type Account struct {
	gorm.Model

	WalletID *uint
	Wallet   *Wallet            `gorm:"foreignKey:WalletID"`
	Code     *SystemAccountCode `gorm:"uniqueIndex"`
	Type     AccountType        `gorm:"not null"`
}
