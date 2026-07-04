package model

import "gorm.io/gorm"

type Side string

const (
	SideDebit  Side = "debit"
	SideCredit Side = "credit"
)

type LedgerEntry struct {
	gorm.Model

	AccountID uint    `gorm:"not null;index"`
	Account   Account `gorm:"foreignKey:AccountID"`
	JournalID uint
	Journal   JournalEntry `gorm:"foreignKey:JournalID"`
	Side      Side
	Amount    uint
}
