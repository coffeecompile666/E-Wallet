package service

import (
	"app/identity/model"
	"app/payment"
	paymentEvent "app/payment/event"
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
	WalletID      uint   `json:"wallet_id" binding:"required"`
	Amount        uint   `json:"amount" binding:"required"`
	BankAccountID uint   `json:"bank_account_id" binding:"required"`
	TxPIN         string `json:"tx_pin" binding:"required"`
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

		// check transaction pin
		txPIN := model.TransactionPin{}
		if err := tx.Where("user_id = ?", userID).First(&txPIN).Error; err != nil {
			return shared.ErrTransactionPINNotSet
		}

		if err := txPIN.Verify(req.TxPIN); err != nil {
			return err
		}

		// lock amount in wallet
		wallet := model2.Wallet{}
		if err := tx.
			Clauses(clause.Locking{
				Strength: "UPDATE",
			}).
			Where("id = ? AND owner_id = ?", req.WalletID, userID).
			First(&wallet).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return shared.ErrNotFound
			}
			return shared.ErrCommon
		}

		if err := wallet.Lock(req.Amount); err != nil {
			return err
		}

		if err := tx.Save(wallet).Error; err != nil {
			return shared.ErrCommon
		}

		// create transfer
		transfer := model2.NewTransfer(req.Amount, userID, req.WalletID, model2.WITHDRAWAL)
		if err := tx.Create(&transfer).Error; err != nil {
			return shared.ErrCommon
		}

		// call payment gateway
		linkedAccount := model3.LinkedBankAccount{}
		if err := tx.Where("id = ? AND user_id = ?", req.BankAccountID, userID).First(&linkedAccount).Error; err != nil {
			return shared.ErrLinkedBankAccountNotFound
		}

		bankTransferCommand := service.BankTransferCommand{
			TransferID: transfer.ID,
			Note:       "Withdrawal",
			Bank:       string(linkedAccount.Bank),
			Number:     linkedAccount.Number,
			Amount:     req.Amount,
			Name:       linkedAccount.Name,
		}

		if err := w.PaymentService.Gateway.TransferToAccount(tx, bankTransferCommand); err != nil {
			return err
		}

		transferID = transfer.ID

		return nil
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	// Phát sự kiện sau khi transaction đã commit thành công
	w.PaymentService.Bus.Publish(paymentEvent.BankTransferSucceed{
		TransferID: transferID,
		Status:     model3.SUCCESS,
	})

	c.JSON(http.StatusOK, shared.Response[uint]{Data: transferID})
}
