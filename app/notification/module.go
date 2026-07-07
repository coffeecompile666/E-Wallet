package notification

import (
	event3 "app/identity/event"
	event2 "app/notification/event"
	"app/notification/model"
	"app/shared"
	"app/shared/eventbus"
	"app/wallet/event"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Notification struct {
	DB  *gorm.DB
	Bus eventbus.EventBus
}

func NewNotification(db *gorm.DB, bus eventbus.EventBus) *Notification {
	return &Notification{
		DB:  db,
		Bus: bus,
	}
}

func (p *Notification) Init(r *gin.RouterGroup) {
	handler := event2.NewHandler(p.DB)

	p.Bus.Subscribe(event3.UserForgotPasswordRequested{}, handler.SendForgotPasswordOTP)
	p.Bus.Subscribe(event3.UserSetTXPINRequested{}, handler.SendSetTxPinOTP)
	p.Bus.Subscribe(event.DepositSuccess{}, handler.NotifyDepositSuccess)
	p.Bus.Subscribe(event.WithdrawalSuccess{}, handler.NotifyWithdrawalSuccess)
	p.Bus.Subscribe(event.TransferOutSuccess{}, handler.NotifyTransferOutSuccess)
	p.Bus.Subscribe(event.TransferToUserSuccess{}, handler.NotyTransferToUserSuccess)
	p.Bus.Subscribe(event3.UserRegistered{}, handler.SendRegisterOTP)

	r.GET("/notification", p.GetNotifications)
}

func (p *Notification) GetNotifications(c *gin.Context) {
	userID := c.MustGet("UserID").(uint)

	var notifications []model.Notification
	if err := p.DB.Where("user_id = ?", userID).Order("id desc").Limit(50).Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, shared.ErrCommon)
		return
	}

	c.JSON(http.StatusOK, shared.Response[[]model.Notification]{Data: notifications})
}
