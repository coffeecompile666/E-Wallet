package service

import (
	"app/identity/model"
	"app/payment"
	model3 "app/payment/model"
	"app/payment/service"
	"app/shared"
	model2 "app/wallet/model"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type WithdrawalService struct {
	DB             *gorm.DB
	PaymentService *payment.Payment
}

func NewWithdrawalService(db *gorm.DB, paymentService *payment.Payment) *WithdrawalService {
	return &WithdrawalService{DB: db, PaymentService: paymentService}
}

type withdrawalRequest struct {
	walletID      uint
	amount        uint
	bankAccountID uint
}

func (w *WithdrawalService) Withdraw(c *gin.Context) {
	userID := c.MustGet(shared.ContextUserID).(uint)
	var transferID uint

	err := w.DB.Transaction(func(tx *gorm.DB) error {
		req := withdrawalRequest{}
		if err := c.ShouldBindJSON(&req); err != nil {
			return shared.ErrBadRequest
		}

		user := &model.User{}
		if err := tx.First(user, userID).Error; err != nil {
			return shared.ErrUserNotFound
		}

		if err := user.VerifyActive(); err != nil {
			return err
		}

		// lock amount in wallet
		wallet := model2.Wallet{}
		if err := tx.
			Clauses(clause.Locking{
				Strength: "UPDATE",
			}).
			Where("id = ? AND user_id = ?", req.walletID, userID).
			First(&wallet).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return shared.ErrNotFound
			}
			return shared.ErrCommon
		}

		if err := wallet.Lock(req.amount); err != nil {
			return err
		}

		if err := tx.Save(wallet).Error; err != nil {
			return shared.ErrCommon
		}

		// create transfer
		transfer := model2.NewTransfer(req.amount, userID, req.walletID, model2.WITHDRAWAL)
		if err := tx.Create(&transfer).Error; err != nil {
			return shared.ErrCommon
		}

		// call payment gateway
		linkedAccount := model3.LinkedBankAccount{}
		if err := tx.Where("id = ? AND user_id = ?", req.bankAccountID, userID).First(&linkedAccount).Error; err != nil {
			return shared.ErrLinkedBankAccountNotFound
		}

		bankTransferCommand := service.BankTransferCommand{
			TransferID: transfer.ID,
			Note:       "Withdrawal",
			Bank:       string(linkedAccount.Bank),
			Number:     linkedAccount.Number,
			Amount:     req.amount,
			Name:       linkedAccount.Name,
		}

		if err := w.PaymentService.Gateway.TransferToAccount(bankTransferCommand); err != nil {
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
