package service

import (
	"app/identity/model"
	"app/shared"
	model2 "app/wallet/model"
	"errors"

	"gorm.io/gorm"
)

type WalletHandlerService struct {
	DB *gorm.DB
}

func NewWalletHandlerService(db *gorm.DB) *WalletHandlerService {
	return &WalletHandlerService{DB: db}
}

func (h *WalletHandlerService) HandleDeposit() {}

func (h *WalletHandlerService) HandleWithdrawal() {}

func (h *WalletHandlerService) HandleTransferOut() {}

func (h *WalletHandlerService) HandleCreateWallet(userID uint) error {
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		var user model.User
		if err := tx.Where("id = ?", userID).First(&user).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return shared.ErrUserNotFound
			}
			return shared.ErrCommon
		}

		var wallet *model2.Wallet
		if err := tx.First(wallet, "user_id = ?", userID).Error; err != nil {
			return nil
		}

		if !user.IsAllowedCreateWallet() {
			return shared.ErrForbidden
		}

		if err := tx.Where("owner_id = ?", userID).First(&wallet).Error; err != nil {
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				return shared.ErrCommon
			}
		}

		if wallet != nil {
			return nil
		}

		wallet = model2.NewWallet(userID)
		if err := tx.Create(wallet).Error; err != nil {
			return shared.ErrCommon
		}

		return nil
	})

	return err
}
