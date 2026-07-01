package service

import (
	"app/messages"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DepositService struct {
	DB  *gorm.DB
	Bus *messages.MessageBus
}

func NewDepositService(db *gorm.DB, bus *messages.MessageBus) *DepositService {
	return &DepositService{DB: db, Bus: bus}
}

func (d *DepositService) Deposit(c *gin.Context) {}
