package service

import (
	model2 "app/identity/model"
	"app/messages"
	"app/shared"
	"app/wallet/model"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type DepositService struct {
	DB  *gorm.DB
	Bus *messages.MessageBus
}

func NewDepositService(db *gorm.DB, bus *messages.MessageBus) *DepositService {
	return &DepositService{DB: db, Bus: bus}
}

type depositRequest struct {
	walletID      uint
	amount        int64
	bankAccountID uint
}

func (d *DepositService) Deposit(c *gin.Context) {
	userID := c.MustGet(shared.ContextUserID).(uint)

	err := d.DB.Transaction(func(tx *gorm.DB) error {
		req := depositRequest{}
		if err := c.ShouldBindJSON(&req); err != nil {
			return err
		}

		var user model2.User
		if err := tx.Where("id = ?", userID).First(&user).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return shared.ErrUserNotFound
			}
			return shared.ErrCommon
		}

		if err := user.VerifyActive(); err != nil {
			return err
		}

		var wallet model.Wallet
		if err := tx.
			Clauses(clause.Locking{
				Strength: "UPDATE",
			}).
			Where("id = ? AND user_id = ?", req.walletID, userID).
			First(&wallet).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return shared.ErrNotFound
			}
			return shared.ErrCommon
		}

		// Todo: Deposit funds into the wallet

		return nil
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	c.JSON(http.StatusOK, shared.Empty{})
}
