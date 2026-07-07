package service

import (
	"app/identity/model"
	"app/messages"
	"app/shared"
	model2 "app/wallet/model"
	"errors"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type WalletHandlerService struct {
	DB  *gorm.DB
	Bus *messages.MessageBus
}

func NewWalletHandlerService(db *gorm.DB, bus *messages.MessageBus) *WalletHandlerService {
	return &WalletHandlerService{DB: db, Bus: bus}
}

type DepositSuccess struct {
	WalletID   uint
	TransferID uint
}

func (d DepositSuccess) Name() string {
	return "wallet.deposit_success"
}

type WithdrawalSuccess struct {
	WalletID   uint
	TransferID uint
}

func (w WithdrawalSuccess) Name() string {
	return "wallet.withdrawal_success"
}

type TransferOutSuccess struct {
	WalletID       uint
	TransferID     uint
	JournalEntryID uint
}

func (t TransferOutSuccess) Name() string {
	return "wallet.transfer_out_success"
}

func (h *WalletHandlerService) HandleDeposit(transferID uint) error {

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
		h.Bus.Dispatch(DepositSuccess{
			WalletID:   wallet.ID,
			TransferID: transfer.Amount,
		})

		return nil
	})

	return err
}

func (h *WalletHandlerService) HandleWithdrawal(transferID uint) error {

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

		// debit wallet
		wallet := &model2.Wallet{}
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", transfer.WalletID).Preload("Account").First(wallet).Error; err != nil {
			return shared.ErrCommon
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

		h.Bus.Dispatch(WithdrawalSuccess{
			WalletID:   wallet.ID,
			TransferID: transfer.ID,
		})

		return nil
	})

	return err
}

func (h *WalletHandlerService) HandleTransferOut(transferID uint) error {
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		var transfer *model2.Transfer

		if err := tx.Where("id = ?", transferID).First(&transfer).Error; err != nil {
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

		h.Bus.Dispatch(TransferOutSuccess{
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

func (h *WalletHandlerService) HandleCreateWallet(userID uint) error {
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
