package wallet

import (
	event2 "app/identity/event"
	"app/payment"
	event3 "app/payment/event"
	"app/shared/eventbus"
	"app/wallet/event"
	"app/wallet/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Wallet struct {
	DB            *gorm.DB
	Bus           eventbus.EventBus
	Payment       *payment.Payment
	WalletHandler *event.WalletEventHandler
}

func NewModule(db *gorm.DB, bus eventbus.EventBus, payment *payment.Payment) *Wallet {
	return &Wallet{
		DB:            db,
		Bus:           bus,
		Payment:       payment,
		WalletHandler: event.NewWalletEventHandler(db, bus),
	}
}

func (w *Wallet) Init(g *gin.RouterGroup) {
	manageWalletService := service.NewManageWalletService(w.DB)
	depositService := service.NewDepositService(w.DB, w.Payment)
	withdrawalService := service.NewWithdrawalService(w.DB, w.Payment)
	transferOutService := service.NewTransferOutService(w.DB, w.Bus, w.Payment)
	transferToUser := service.NewTransferToUserService(w.DB, w.Bus)

	g.GET("/wallet/me", manageWalletService.GetWalletByUserID)
	g.GET("/wallet/transaction", manageWalletService.GetTransactions)
	g.POST("/wallet/deposit", depositService.Deposit)
	g.POST("/wallet/withdrawal", withdrawalService.Withdraw)
	g.POST("/wallet/transfer-out", transferOutService.TransferOut)
	g.GET("/wallet/transfer/:id", manageWalletService.GetTransferByID)
	g.POST("/wallet/transfer-to-user", transferToUser.Execute)

	handler := event.NewWalletEventHandler(w.DB, w.Bus)
	w.Bus.Subscribe(event3.BankWithdrawalSucceed{}, handler.HandleDeposit)
	w.Bus.Subscribe(event3.BankTransferSucceed{}, handler.HandleTransferOut)
	w.Bus.Subscribe(event2.UserSignupSuccess{}, handler.HandleCreateWallet)
}
