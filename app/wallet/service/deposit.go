package service

import (
	model2 "app/identity/model"
	"app/messages"
	"app/payment"
	"app/payment/service"
	"app/shared"
	"app/wallet/model"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type DepositService struct {
	DB      *gorm.DB
	Bus     *messages.MessageBus
	Payment *payment.Payment
}

func NewDepositService(db *gorm.DB, bus *messages.MessageBus, payment *payment.Payment) *DepositService {
	return &DepositService{DB: db, Bus: bus, Payment: payment}
}

type depositRequest struct {
	WalletID      uint `json:"wallet_id"`
	Amount        uint `json:"amount"`
	BankAccountID uint `json:"bank_account_id"`
}

func (d *DepositService) Deposit(c *gin.Context) {
	userID := c.MustGet(shared.ContextUserID).(uint)
	var transferID uint

	err := d.DB.Transaction(func(tx *gorm.DB) error {
		req := depositRequest{}
		if err := c.ShouldBindJSON(&req); err != nil {
			return err
		}

		var user model2.User
		if err := tx.Where("id = ?", userID).First(&user).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return shared.ErrUserNotFound
			}
			return shared.ErrCommon
		}

		if err := user.VerifyActive(); err != nil {
			return err
		}

		var wallet model.Wallet
		if err := tx.
			Clauses(clause.Locking{
				Strength: "UPDATE",
			}).
			Where("id = ? AND user_id = ?", req.WalletID, userID).
			First(&wallet).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return shared.ErrNotFound
			}
			return shared.ErrCommon
		}

		transfer := model.NewTransfer(req.Amount, userID, wallet.ID, model.DEPOSIT)

		if err := tx.Create(&transfer).Error; err != nil {
			return shared.ErrCommon
		}

		account, err := d.Payment.Gateway.GetAccountByID(tx, req.BankAccountID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return shared.ErrBankAccountNotFound
			}
			if account.UserID != user.ID {
				return shared.ErrForbidden
			}
		}

		if err := d.Payment.Gateway.WithdrawalAccount(service.WithdrawalCommand{
			TransferID: transfer.ID,
			Amount:     req.Amount,
			AccountID:  account.ID,
		}); err != nil {
			return err
		}

		transferID = transfer.ID

		return nil
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	c.JSON(http.StatusOK, shared.Response[uint]{Data: transferID})
}
