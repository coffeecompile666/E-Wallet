package service

import (
	model2 "app/identity/model"
	"app/payment"
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
	WalletID uint   `json:"wallet_id"`
	Amount   uint   `json:"amount"`
	Bank     string `json:"bank"`
	Number   string `json:"number"`
	Name     string `json:"name"`
	Note     string `json:"note"`
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

		if err := t.Payment.Gateway.TransferToAccount(bankTransferCommand); err != nil {
			return err
		}

		transferID = transfer.ID

		return nil
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrBadRequest)
		return
	}

	c.JSON(http.StatusOK, shared.Response[uint]{Data: transferID})
}
