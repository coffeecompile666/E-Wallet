package service

import (
	"app/shared"
	model2 "app/wallet/model"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type WalletService struct {
	DB *gorm.DB
}

func NewManageWalletService(db *gorm.DB) *WalletService {
	return &WalletService{DB: db}
}

func (w *WalletService) GetWalletByUserID(c *gin.Context) {
	userID := c.MustGet(shared.ContextUserID).(uint)

	var wallet model2.Wallet

	if err := w.DB.Where("owner_id", userID).First(&wallet).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, shared.ErrNotFound)
			return
		}
		c.JSON(http.StatusInternalServerError, shared.ErrCommon)
		return
	}

	c.JSON(http.StatusOK, shared.Response[model2.Wallet]{
		Data: wallet,
	})
}

func (w *WalletService) GetTransactions(c *gin.Context) {
	start, end, err := validateStartEnd(c.Query("start"), c.Query("end"))
	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	walletID, err := validateWalletID(c.Query("wallet_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	userID := c.MustGet(shared.ContextUserID).(uint)

	var wallet model2.Wallet
	if err := w.DB.First(&wallet, walletID).Error; err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrNotFound)
		return
	}

	if wallet.OwnerID != userID {
		c.JSON(http.StatusForbidden, shared.ErrForbidden)
		return
	}

	var txs []*model2.Transfer
	if err := w.DB.
		Where("wallet_id = ?", walletID).
		Order("created_at DESC").
		Offset(int(start)).
		Limit(int(end - start)).
		Find(&txs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, shared.ErrCommon)
		return
	}

	c.JSON(http.StatusOK, shared.Cursor[*model2.Transfer]{
		Start: start,
		End:   end,
		Items: txs,
	})
}

func (w *WalletService) GetTransferByID(c *gin.Context) {
	transfer := &model2.Transfer{}
	if err := w.DB.First(transfer, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrNotFound)
		return
	}
	c.JSON(http.StatusOK, shared.Response[*model2.Transfer]{Data: transfer})
}

func validateStartEnd(startStr, endStr string) (uint, uint, error) {
	if startStr == "" {
		startStr = "0"
	}

	if endStr == "" {
		endStr = "10"
	}

	start, err := strconv.ParseUint(startStr, 10, 64)
	if err != nil {
		return 0, 0, shared.ErrBadRequest
	}

	end, err := strconv.ParseUint(endStr, 10, 64)
	if err != nil {
		return 0, 0, shared.ErrBadRequest
	}

	if start > end {
		return 0, 0, shared.ErrBadRequest
	}

	return uint(start), uint(end), nil
}

func validateWalletID(walletIDStr string) (uint, error) {
	id, err := strconv.ParseUint(walletIDStr, 10, 64)
	if err != nil || id == 0 {
		return 0, shared.ErrBadRequest
	}

	return uint(id), nil
}
