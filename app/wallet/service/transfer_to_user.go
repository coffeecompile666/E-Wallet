package service

import (
	"app/identity/model"
	"app/messages"
	"app/shared"
	model2 "app/wallet/model"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type TransferToUserService struct {
	DB  *gorm.DB
	Bus *messages.MessageBus
}

func NewTransferToUserService(db *gorm.DB, bus *messages.MessageBus) *TransferToUserService {
	return &TransferToUserService{
		DB:  db,
		Bus: bus,
	}
}

type TransferToUserRequest struct {
	walletID   uint
	receiverID uint
	amount     uint
	note       string
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
		if err := service.DB.First(&receiver, userID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return shared.ErrUserNotFound
			}
			return shared.ErrCommon
		}

		wallet, err := service.getWalletForUpdate(tx, userID, req.walletID)
		if err != nil {
			return err
		}

		if err := wallet.Debit(req.amount); err != nil {
			return err
		}

		if err := tx.Save(wallet).Error; err != nil {
			return err
		}

		receiverWallet, err := service.getWalletForUpdate(tx, userID, receiver.ID)
		if err != nil {
			return err
		}

		if err := receiverWallet.Credit(req.amount); err != nil {
			return err
		}

		if err := tx.Save(receiverWallet).Error; err != nil {
			return err
		}

		// Todo: write to ledger

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
		Where("id = ? AND user_id = ?", walletID, userID).
		First(&wallet).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared.ErrNotFound
		}
		return nil, shared.ErrCommon
	}

	return &wallet, nil
}
