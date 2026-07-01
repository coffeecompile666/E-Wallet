package service

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type WalletHandlerService struct {
	DB *gorm.DB
}

func NewWalletHandlerService(db *gorm.DB) *WalletHandlerService {
	return &WalletHandlerService{DB: db}
}

func (h *WalletHandlerService) HandleDeposit(c *gin.Context) {}

func (h *WalletHandlerService) HandleWithdrawal(c *gin.Context) {}

func (h *WalletHandlerService) HandleTransferOut(c *gin.Context) {}
