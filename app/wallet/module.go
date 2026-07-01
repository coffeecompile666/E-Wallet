package wallet

import (
	"app/messages"
	"app/payment"
	"app/wallet/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Wallet struct {
	DB      *gorm.DB
	Bus     *messages.MessageBus
	Payment *payment.Payment
}

func NewModule(db *gorm.DB, bus *messages.MessageBus, payment *payment.Payment) *Wallet {
	return &Wallet{
		DB:      db,
		Bus:     bus,
		Payment: payment,
	}
}

func (w *Wallet) Bootstrap(g *gin.RouterGroup) {
	manageWalletService := service.NewManageWalletService(w.DB, w.Bus)

	g.POST("/", manageWalletService.CreateWallet)
	g.GET("/transaction", manageWalletService.GetTransactions)
}
