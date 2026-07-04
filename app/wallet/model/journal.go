package model

import (
	"app/shared"

	"gorm.io/gorm"
)

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

func (j *JournalEntry) AddLedgerEntry(accountID uint, amount uint, side Side) {
	ledgerEntry := LedgerEntry{
		AccountID: accountID,
		Amount:    amount,
		Side:      side,
	}
	j.LedgerEntries = append(j.LedgerEntries, ledgerEntry)
}

func (j *JournalEntry) Validate() error {
	if len(j.LedgerEntries) < 2 {
		return shared.ErrJournalEntryMustHaveTwo
	}

	debit := 0
	credit := 0

	for _, ledgerEntry := range j.LedgerEntries {
		if ledgerEntry.Side == SideDebit {
			debit += int(ledgerEntry.Amount)
		} else if ledgerEntry.Side == SideCredit {
			credit += int(ledgerEntry.Amount)
		}
	}

	if debit != credit {
		return shared.ErrJournalEntryDebitCreditMustBeEqual
	}
	return nil
}
