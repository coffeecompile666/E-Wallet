package payment

import (
	"app/messages"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Payment struct {
	DB  *gorm.DB
	Bus *messages.MessageBus
}

func NewModule(db *gorm.DB, bus *messages.MessageBus) *Payment {
	return &Payment{
		DB:  db,
		Bus: bus,
	}
}

func (p *Payment) Bootstrap(g *gin.RouterGroup) {

}
