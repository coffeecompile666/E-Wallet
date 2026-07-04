package service

import (
	"app/messages"
	"app/payment"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TransferOutService struct {
	DB      *gorm.DB
	Bus     *messages.MessageBus
	Payment *payment.Payment
}

func NewTransferOutService(db *gorm.DB, bus *messages.MessageBus, payment *payment.Payment) *TransferOutService {
	return &TransferOutService{DB: db, Bus: bus, Payment: payment}
}

func (t *TransferOutService) TransferOut(c *gin.Context) {

}
