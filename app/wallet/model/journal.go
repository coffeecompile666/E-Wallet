package model

import "gorm.io/gorm"

type JournalEntry struct {
	gorm.Model

	Description   string        `gorm:"size:255"`
	LedgerEntries []LedgerEntry `gorm:"foreignkey:JournalID"`
}

func NewJournalEntry() *JournalEntry {
	return &JournalEntry{
		LedgerEntries: make([]LedgerEntry, 0),
	}
}

func (j *JournalEntry) AddLedgerEntry(account Account, amount uint) {
}
