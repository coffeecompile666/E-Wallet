package service

import (
	model2 "app/identity/model"
	"app/payment"
	paymentEvent "app/payment/event"
	paymentModel "app/payment/model"
	"app/payment/service"
	"app/shared"
	"app/shared/eventbus"
	"app/wallet/model"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type TransferOutService struct {
	DB      *gorm.DB
	Bus     eventbus.EventBus
	Payment *payment.Payment
}

func NewTransferOutService(db *gorm.DB, bus eventbus.EventBus, payment *payment.Payment) *TransferOutService {
	return &TransferOutService{DB: db, Bus: bus, Payment: payment}
}

type transferOutRequest struct {
	WalletID uint   `json:"wallet_id" binding:"required"`
	Amount   uint   `json:"amount" binding:"required"`
	Bank     string `json:"bank" binding:"required"`
	Number   string `json:"number" binding:"required"`
	Name     string `json:"name" binding:"required"`
	Note     string `json:"note"`
	TxPIN    string `json:"tx_pin" binding:"required"`
}

func (t *TransferOutService) TransferOut(c *gin.Context) {
	userID := c.MustGet(shared.ContextUserID).(uint)
	var transferID uint

	err := t.DB.Transaction(func(tx *gorm.DB) error {
		req := transferOutRequest{}
		if err := c.ShouldBindJSON(&req); err != nil {
			return shared.ErrBadRequest
		}

		// check user
		var user model2.User
		if err := tx.Where("id = ?", userID).First(&user).Error; err != nil {
			return shared.ErrUserNotFound
		}

		if err := user.VerifyActive(); err != nil {
			return err
		}

		// check transaction pin
		txPIN := model2.TransactionPin{}
		if err := tx.Where("user_id = ?", userID).First(&txPIN).Error; err != nil {
			return shared.ErrTransactionPINNotSet
		}

		if err := txPIN.Verify(req.TxPIN); err != nil {
			return err
		}

		// lock wallet
		var wallet model.Wallet
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ? AND owner_id = ?", req.WalletID, userID).First(&wallet).Error; err != nil {
			return shared.ErrWalletNotFound
		}

		if err := wallet.Lock(req.Amount); err != nil {
			return err
		}

		if err := tx.Save(wallet).Error; err != nil {
			return shared.ErrCommon
		}

		// create transfer
		transfer := model.NewTransfer(req.Amount, userID, req.WalletID, model.TRANSFER_OUT)
		if err := tx.Create(&transfer).Error; err != nil {
			return shared.ErrCommon
		}

		// call payment gateway
		bankTransferCommand := service.BankTransferCommand{
			TransferID: transfer.ID,
			Note:       req.Note,
			Bank:       req.Bank,
			Number:     req.Number,
			Amount:     req.Amount,
			Name:       req.Name,
		}

		if err := t.Payment.Gateway.TransferToAccount(tx, bankTransferCommand); err != nil {
			return err
		}

		transferID = transfer.ID

		return nil
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrBadRequest)
		return
	}

	// Phát sự kiện sau khi transaction đã commit thành công
	t.Bus.Publish(paymentEvent.BankTransferSucceed{
		TransferID: transferID,
		Status:     paymentModel.SUCCESS,
	})

	c.JSON(http.StatusOK, shared.Response[uint]{Data: transferID})
}
