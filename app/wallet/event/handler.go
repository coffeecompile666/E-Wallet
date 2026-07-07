package event

import (
	"app/identity/event"
	"app/identity/model"
	event2 "app/payment/event"
	"app/shared"
	"app/shared/eventbus"
	"app/shared/logger"
	model2 "app/wallet/model"
	"errors"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type WalletEventHandler struct {
	DB  *gorm.DB
	Bus eventbus.EventBus
}

func NewWalletEventHandler(db *gorm.DB, bus eventbus.EventBus) *WalletEventHandler {
	return &WalletEventHandler{DB: db, Bus: bus}
}

func (h *WalletEventHandler) HandleDeposit(e eventbus.Event) error {
	transferID := e.(event2.BankWithdrawalSucceed).TransferID
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		// update transfer status
		transfer := &model2.Transfer{}
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", transferID).First(transfer).Error; err != nil {
			return shared.ErrCommon
		}

		if transfer.IsComplete() {
			return nil
		}

		if err := transfer.SetStatusCompleted(); err != nil {
			return err
		}

		if err := tx.Save(transfer).Error; err != nil {
			return shared.ErrCommon
		}

		// credit wallet
		wallet := &model2.Wallet{}
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", transfer.WalletID).Preload("Account").First(wallet).Error; err != nil {
			return shared.ErrCommon
		}

		if err := wallet.Credit(transfer.Amount); err != nil {
			return err
		}
		if err := tx.Save(wallet).Error; err != nil {
			return shared.ErrCommon
		}

		// write to ledger
		journalEntry := model2.NewJournalEntry()
		journalEntry.AddLedgerEntry(wallet.Account.ID, transfer.Amount, model2.SideCredit)

		var systemBankAssetAccount *model2.Account
		if err := tx.Where("code = ?", model2.SystemBankAssetCode).First(&systemBankAssetAccount).Error; err != nil {
			return shared.ErrSystemAccountNotFound
		}
		journalEntry.AddLedgerEntry(systemBankAssetAccount.ID, transfer.Amount, model2.SideDebit)

		if err := journalEntry.Validate(); err != nil {
			return err
		}

		if err := tx.Create(journalEntry).Error; err != nil {
			return shared.ErrCommon
		}

		// Send notification
		h.Bus.Publish(DepositSuccess{
			WalletID:   wallet.ID,
			TransferID: transfer.Amount,
		})

		return nil
	})

	return err
}

func (h *WalletEventHandler) HandleTransferOut(e eventbus.Event) error {
	transferID := e.(event2.BankTransferSucceed).TransferID

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		var transfer *model2.Transfer

		if err := tx.Where("id = ?", transferID).First(&transfer).Error; err != nil {
			logger.Log.Error("transfer not found", "err", err)
			return shared.ErrTransferNotFound
		}

		if transfer.IsComplete() {
			return nil
		}

		// update transfer status
		if err := transfer.SetStatusCompleted(); err != nil {
			return err
		}

		if err := tx.Save(transfer).Error; err != nil {
			return shared.ErrCommon
		}

		// wallet
		var wallet *model2.Wallet
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", transfer.WalletID).Preload("Account").First(&wallet).Error; err != nil {
			return shared.ErrWalletNotFound
		}

		if err := wallet.Unlock(transfer.Amount); err != nil {
			return err
		}

		if err := wallet.Debit(transfer.Amount); err != nil {
			return err
		}

		if err := tx.Save(wallet).Error; err != nil {
			return shared.ErrCommon
		}

		// write to ledger
		var systemBankAccount *model2.Account
		if err := tx.Where("code = ?", model2.SystemBankAssetCode).First(&systemBankAccount).Error; err != nil {
			return shared.ErrSystemAccountNotFound
		}

		journalEntry := model2.NewJournalEntry()
		journalEntry.AddLedgerEntry(systemBankAccount.ID, transfer.Amount, model2.SideCredit)
		journalEntry.AddLedgerEntry(wallet.Account.ID, transfer.Amount, model2.SideDebit)

		if err := journalEntry.Validate(); err != nil {
			return err
		}

		if err := tx.Create(journalEntry).Error; err != nil {
			return shared.ErrCommon
		}

		h.Bus.Publish(TransferOutSuccess{
			WalletID:       wallet.ID,
			TransferID:     transfer.ID,
			JournalEntryID: journalEntry.ID,
		})

		return nil
	})

	if err != nil {
		return err
	}

	return nil
}

func (h *WalletEventHandler) HandleCreateWallet(e eventbus.Event) error {
	userID := e.(event.UserSignupSuccess).UserID

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		var user model.User
		if err := tx.Where("id = ?", userID).First(&user).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return shared.ErrUserNotFound
			}
			return shared.ErrCommon
		}

		wallet := &model2.Wallet{}
		err := tx.First(wallet, "owner_id = ?", userID).Error

		if err == nil {
			return nil
		}

		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return shared.ErrCommon
		}

		if !user.IsAllowedCreateWallet() {
			return shared.ErrForbidden
		}

		wallet = model2.NewWallet(userID)
		wallet.Account = model2.Account{
			Code: nil,
			Type: model2.Liability,
		}

		if err := tx.Create(wallet).Error; err != nil {
			return shared.ErrCommon
		}

		return nil
	})

	return err
}
