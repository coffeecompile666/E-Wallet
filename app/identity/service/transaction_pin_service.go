package service

import (
	"app/identity/dto"
	"app/identity/model"
	"app/messages"
	"app/shared"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TransactionPinService struct {
	DB         *gorm.DB
	MessageBus *messages.MessageBus
}

func (s TransactionPinService) Create(c *gin.Context) {
	userID := c.MustGet(shared.ContextUserID).(uint)

	user := &model.User{}
	if err := s.DB.First(user, userID).Error; err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrUserNotFound)
		return
	}

	if err := user.VerifyActive(); err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	err, otp, code := model.NewOTP(user.ID, model.OTPPurposeSetTransactionPIN)
	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	if err := s.DB.Create(otp).Error; err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrCommon)
		return
	}

	s.MessageBus.Dispatch(dto.UserSetTXPINRequested{
		OTP:   code,
		Email: user.Email,
	})

	c.JSON(http.StatusOK, shared.Response[uint]{
		Data: otp.ID,
	})
}

func (s TransactionPinService) ConfirmCreate(c *gin.Context) {
	userID := c.MustGet(shared.ContextUserID).(uint)
	body := dto.ConfirmTXPINRequest{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrBadRequest)
		return
	}

	err := s.DB.Transaction(func(tx *gorm.DB) error {
		otp := &model.OTP{}
		if err := tx.
			Where("id = ? AND user_id = ?", body.OtpID, userID).
			First(otp).Error; err != nil {
			return shared.ErrOTPInvalid
		}

		// verify otp and set verified
		if err := otp.Verify(body.OTP); err != nil {
			return err
		}

		if err := tx.Save(otp).Error; err != nil {
			return shared.ErrCommon
		}

		txPin := &model.TransactionPin{}
		err := tx.Where("user_id = ?", userID).First(txPin).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				txPin = &model.TransactionPin{UserID: userID}
				if err := tx.Create(txPin).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}

		if err := txPin.Change(body.PIN); err != nil {
			return err
		}

		return tx.Save(txPin).Error
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}
	c.JSON(http.StatusOK, shared.Empty{})
}
