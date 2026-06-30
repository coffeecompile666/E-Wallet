package service

import (
	"app/messages"
	"app/payment/model"
	"app/shared"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ManageLinkedBankAccountService struct {
	DB  *gorm.DB
	Bus *messages.MessageBus
}

func NewManageLinkedBankAccountService(db *gorm.DB, bus *messages.MessageBus) *ManageLinkedBankAccountService {
	return &ManageLinkedBankAccountService{DB: db, Bus: bus}
}

const MaxLinkedBankAccount = 5

func (m *ManageLinkedBankAccountService) GetMe(c *gin.Context) {
	userID := c.MustGet(shared.ContextUserID).(uint)

	var accounts []model.LinkedBankAccount
	if err := m.DB.Where("user_id = ?", userID).Find(&accounts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, shared.ErrCommon)
		return
	}
	c.JSON(http.StatusOK, shared.Response[[]model.LinkedBankAccount]{
		Data: accounts,
	})
}

type AddLinkedBankAccountRequest struct {
	Number string               `json:"number"`
	Name   string               `json:"name"`
	Bank   model.SupportedBanks `json:"bank"`
}

func (m *ManageLinkedBankAccountService) Add(c *gin.Context) {
	userID := c.MustGet(shared.ContextUserID).(uint)
	body := AddLinkedBankAccountRequest{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrBadRequest)
		return
	}

	err := m.DB.Transaction(func(tx *gorm.DB) error {
		var myAccounts []model.LinkedBankAccount
		if err := tx.Where("user_id = ?", userID).Find(&myAccounts).Error; err != nil {
			return err
		}

		if len(myAccounts) >= MaxLinkedBankAccount {
			return shared.ErrMaxLinkedBankAccount
		}

		var isAccountExist bool
		for _, account := range myAccounts {
			if account.Number == body.Number {
				isAccountExist = true
				break
			}

			if account.Bank == body.Bank {
				isAccountExist = true
				break
			}
		}

		if isAccountExist {
			return shared.ErrLinkedBankAccountExist
		}

		account := &model.LinkedBankAccount{
			UserID: userID,
			Number: body.Number,
			Bank:   body.Bank,
			Name:   body.Name,
		}
		if err := tx.Create(account).Error; err != nil {
			return shared.ErrCommon
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, shared.ErrCommon)
		return
	}

	c.JSON(http.StatusOK, shared.Empty{})
}

func (m *ManageLinkedBankAccountService) Remove(c *gin.Context) {
	userID := c.MustGet(shared.ContextUserID).(uint)
	accountID := c.Param("id")

	var account model.LinkedBankAccount
	if err := m.DB.Where("user_id = ? AND id = ?", userID, accountID).First(&account).Error; err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrLinkedBankAccountNotFound)
		return
	}

	if err := m.DB.Where("user_id = ? AND id = ?", userID, accountID).Delete(&model.LinkedBankAccount{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, shared.ErrCommon)
		return
	}

	c.JSON(http.StatusOK, shared.Empty{})
}
