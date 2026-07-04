package wallet

import (
	"app/messages"
	"app/payment"
	"app/wallet/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Wallet struct {
	DB            *gorm.DB
	Bus           *messages.MessageBus
	Payment       *payment.Payment
	WalletHandler *service.WalletHandlerService
}

func NewModule(db *gorm.DB, bus *messages.MessageBus, payment *payment.Payment) *Wallet {
	return &Wallet{
		DB:            db,
		Bus:           bus,
		Payment:       payment,
		WalletHandler: service.NewWalletHandlerService(db),
	}
}

func (w *Wallet) Bootstrap(g *gin.RouterGroup) {
	manageWalletService := service.NewManageWalletService(w.DB, w.Bus)
	depositService := service.NewDepositService(w.DB, w.Bus, w.Payment)
	withdrawalService := service.NewWithdrawalService(w.DB, w.Payment)
	transferOutService := service.NewTransferOutService(w.DB, w.Bus, w.Payment)

	g.GET("/wallet/:walletID", manageWalletService.GetWalletByID)
	g.GET("/wallet/transaction", manageWalletService.GetTransactions)
	g.POST("/wallet/deposit", depositService.Deposit)
	g.POST("/wallet/withdrawal", withdrawalService.Withdraw)
	g.POST("/wallet/transfer-out", transferOutService.TransferOut)
}
