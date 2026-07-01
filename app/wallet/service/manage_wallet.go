package service

import (
	"app/identity/model"
	"app/messages"
	"app/shared"
	model2 "app/wallet/model"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ManageWalletService struct {
	DB  *gorm.DB
	Bus *messages.MessageBus
}

func NewManageWalletService(db *gorm.DB, bus *messages.MessageBus) *ManageWalletService {
	return &ManageWalletService{DB: db, Bus: bus}
}

func (mws *ManageWalletService) CreateWallet(c *gin.Context) {
	userID := c.MustGet(shared.ContextUserID).(uint)

	err := mws.DB.Transaction(func(tx *gorm.DB) error {
		var user model.User
		if err := tx.Where("id = ?", userID).First(&user).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return shared.ErrUserNotFound
			}
			return shared.ErrCommon
		}

		var wallet *model2.Wallet
		if err := tx.First(wallet, "user_id = ?", userID).Error; err != nil {
			return nil
		}

		if !user.IsAllowedCreateWallet() {
			return shared.ErrForbidden
		}

		wallet = model2.NewWallet(userID)
		if err := tx.Create(wallet).Error; err != nil {
			return shared.ErrCommon
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	c.JSON(http.StatusCreated, shared.Empty{})
}

func (mws *ManageWalletService) GetTransactions(c *gin.Context) {
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
	if err := mws.DB.First(&wallet, walletID).Error; err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrNotFound)
		return
	}

	if wallet.OwnerID != userID {
		c.JSON(http.StatusForbidden, shared.ErrForbidden)
		return
	}

	var txs []*model2.Transaction
	if err := mws.DB.
		Where("wallet_id = ?", walletID).
		Order("created_at DESC").
		Offset(int(start)).
		Limit(int(end - start)).
		Find(&txs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, shared.ErrCommon)
		return
	}

	c.JSON(http.StatusOK, shared.Cursor[*model2.Transaction]{
		Start: start,
		End:   end,
		Items: txs,
	})
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
