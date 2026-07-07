package payment

import (
	"app/messages"
	"app/payment/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Payment struct {
	DB      *gorm.DB
	Bus     *messages.MessageBus
	Gateway *service.GatewayService
}

func NewModule(db *gorm.DB, bus *messages.MessageBus) *Payment {
	gatewayService := service.NewGatewayService(db, bus)
	return &Payment{
		DB:      db,
		Bus:     bus,
		Gateway: gatewayService,
	}
}

func (p *Payment) Bootstrap(g *gin.RouterGroup) {
	linkedAccountService := service.NewManageLinkedBankAccountService(p.DB, p.Bus)

	g.GET("/payment/linked_bank_account", linkedAccountService.GetMe)
	g.POST("/payment/linked_bank_account", linkedAccountService.Add)
	g.DELETE("/payment/linked_bank_account/:id", linkedAccountService.Remove)
}
