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

	g.GET("/", linkedAccountService.GetMe)
	g.POST("/", linkedAccountService.Add)
	g.DELETE("/:id", linkedAccountService.Remove)
}
