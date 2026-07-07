package service

import (
	"app/identity/model"
	"app/shared"
	"app/shared/eventbus"
	"app/wallet/event"
	model2 "app/wallet/model"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type TransferToUserService struct {
	DB  *gorm.DB
	Bus eventbus.EventBus
}

func NewTransferToUserService(db *gorm.DB, bus eventbus.EventBus) *TransferToUserService {
	return &TransferToUserService{
		DB:  db,
		Bus: bus,
	}
}

type TransferToUserRequest struct {
	WalletID   uint   `json:"wallet_id" binding:"required"`
	ReceiverID uint   `json:"receiver_id" binding:"required"`
	Amount     uint   `json:"amount" binding:"required"`
	Note       string `json:"note"`
}

func (service *TransferToUserService) Execute(c *gin.Context) {
	userID := c.MustGet("UserID").(uint)

	err := service.DB.Transaction(func(tx *gorm.DB) error {
		req := TransferToUserRequest{}
		if err := c.ShouldBindJSON(&req); err != nil {
			return shared.ErrBadRequest
		}

		var user model.User
		if err := tx.Where("id = ?", userID).First(&user).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return shared.ErrUserNotFound
			}
			return shared.ErrCommon
		}

		if err := user.VerifyActive(); err != nil {
			return err
		}

		var receiver model.User
		if err := service.DB.First(&receiver, req.ReceiverID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return shared.ErrUserNotFound
			}
			return shared.ErrCommon
		}

		wallet, err := service.getWalletForUpdate(tx, userID, req.WalletID)
		if err != nil {
			return err
		}

		if err := wallet.Debit(req.Amount); err != nil {
			return err
		}

		if err := tx.Save(wallet).Error; err != nil {
			return err
		}

		receiverWallet, err := service.getWalletForUpdate(tx, req.ReceiverID, receiver.ID)
		if err != nil {
			return err
		}

		if err := receiverWallet.Credit(req.Amount); err != nil {
			return err
		}

		if err := tx.Save(receiverWallet).Error; err != nil {
			return err
		}

		journalEntry := model2.NewJournalEntry()

		journalEntry.AddLedgerEntry(wallet.Account.ID, req.Amount, model2.SideDebit)
		journalEntry.AddLedgerEntry(receiverWallet.Account.ID, req.Amount, model2.SideCredit)

		if err := journalEntry.Validate(); err != nil {
			return err
		}

		if err := tx.Create(&journalEntry).Error; err != nil {
			return shared.ErrCommon
		}

		service.Bus.Publish(event.TransferToUserSuccess{
			WalletID:         wallet.ID,
			ReceiverWalletID: receiverWallet.ID,
			TransferID:       journalEntry.ID,
		})

		return nil
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	c.JSON(http.StatusOK, shared.Empty{})
}

func (service *TransferToUserService) getWalletForUpdate(tx *gorm.DB, userID uint, walletID uint) (*model2.Wallet, error) {
	var wallet model2.Wallet

	if err := tx.
		Clauses(clause.Locking{
			Strength: "UPDATE",
		}).
		Where("id = ? AND owner_id = ?", walletID, userID).
		Preload("Account").
		First(&wallet).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared.ErrNotFound
		}
		return nil, shared.ErrCommon
	}

	return &wallet, nil
}
