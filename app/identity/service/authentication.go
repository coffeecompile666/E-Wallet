package service

import (
	"app/identity/dto"
	"app/identity/model"
	"app/messages"
	"app/shared"
	"app/shared/logger"
	"errors"
	"net/http"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuthenticationService struct {
	DB         *gorm.DB
	MessageBus *messages.MessageBus
}

func (s AuthenticationService) Signup(c *gin.Context) {
	body := dto.SignupRequest{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrBadRequest)
		return
	}
	var event dto.UserRegistered
	var otpID uint

	err := s.DB.Transaction(func(tx *gorm.DB) error {
		user := &model.User{Email: body.Email}

		err := tx.Where("email = ?", user.Email).First(user).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			if err := tx.Create(user).Error; err != nil {
				return shared.ErrCommon
			}
		}

		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			logger.Log.Error(err.Error())
			return shared.ErrCommon
		}

		if !user.IsPending() {
			return shared.ErrUserAlreadyExist
		}

		err, otp, code := model.NewOTP(user.ID, model.OTPPurposeRegister)
		if err != nil {
			return err
		}
		if err := tx.Create(otp).Error; err != nil {
			logger.Log.Error(err.Error())
			return shared.ErrCommon
		}
		otpID = otp.ID

		event = dto.UserRegistered{Email: user.Email, OTP: code, UserID: user.ID, UserName: user.Name}
		return nil
	})

	if err != nil {
		var sharedErr shared.Error
		if errors.As(err, &sharedErr) {
			c.JSON(sharedErr.Status, sharedErr)
			return
		}
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			c.JSON(shared.ErrUserAlreadyExist.Status, shared.ErrUserAlreadyExist)
			return
		}
		c.JSON(http.StatusInternalServerError, shared.ErrCommon)
		return
	}

	s.MessageBus.Dispatch(event)
	c.JSON(http.StatusCreated, shared.Response[uint]{
		Data: otpID,
	})
}

func (s AuthenticationService) VerifyOTP(c *gin.Context) {
	body := dto.VerifyOTPRequest{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrBadRequest)
		return
	}

	otp := &model.OTP{}
	otp.ID = body.OtpID
	if err := s.DB.First(otp).Error; err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrOTPInvalid)
		return
	}
	if err := otp.CanVerify(body.OTP); err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	c.JSON(http.StatusOK, shared.Empty{})
}

func (s AuthenticationService) ConfirmSignup(c *gin.Context) {
	body := &dto.ConfirmSignup{}
	if err := c.ShouldBindJSON(body); err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrBadRequest)
		return
	}

	if body.Password != body.PasswordConfirmation {
		c.JSON(http.StatusBadRequest, shared.ErrPasswordNotMatch)
		return
	}

	err := s.DB.Transaction(func(tx *gorm.DB) error {
		otp := model.OTP{}
		if err := tx.First(&otp, body.OtpID).Error; err != nil {
			return shared.ErrOTPInvalid
		}

		if err := otp.Verify(body.OTP); err != nil {
			return err
		}

		user := &model.User{}
		if err := tx.First(user, otp.UserID).Error; err != nil {
			return shared.ErrUserNotFound
		}
		if err := user.ConfirmSignup(body.Password); err != nil {
			return err
		}

		if err := tx.Save(user).Error; err != nil {
			return err
		}

		if err := tx.Save(otp).Error; err != nil {
			return err
		}

		s.MessageBus.Dispatch(dto.UserSignupSuccess{
			UserID: user.ID,
			Email:  user.Email,
		})

		return nil
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	c.JSON(http.StatusOK, shared.Empty{})
}

func (s AuthenticationService) Signing(c *gin.Context) {
	body := &dto.LoginRequest{}
	if err := c.ShouldBindJSON(body); err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrBadRequest)
		return
	}

	user := &model.User{Email: body.Email}
	if err := s.DB.First(user).Error; err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrUserNotFound)
		return
	}

	if err := user.VerifyActive(); err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	if err := user.VerifyPassword(body.Password); err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	session, refreshToken, err := model.NewSession(user.ID, c.Request.UserAgent(), c.ClientIP())
	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	if err := s.DB.Create(session).Error; err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrCommon)
		return
	}

	accessToken, err := model.GenerateAccessToken(user.ID, session.ID)

	err = saveRefreshToken(c, refreshToken)
	if err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrCommon)
		return
	}

	c.JSON(http.StatusOK, shared.Response[model.TokenPair]{
		Data: model.TokenPair{AccessToken: accessToken, RefreshToken: refreshToken},
	})
}

func (s AuthenticationService) Logout(c *gin.Context) {
	userID := c.MustGet(shared.ContextUserID).(uint)
	session := model.Session{UserID: userID}
	session.ID = c.MustGet(shared.ContextSessionID).(uint)

	if err := s.DB.First(&session).Error; err != nil {
		c.JSON(http.StatusOK, shared.Empty{})
		return
	}
	session.Revoke()
	if err := s.DB.Save(&session).Error; err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrCommon)
		return
	}

	c.JSON(http.StatusOK, shared.Empty{})
}

func (s AuthenticationService) RefreshToken(c *gin.Context) {
	sessionID := c.MustGet(shared.ContextSessionID).(uint)
	session := &model.Session{}
	tokenPair := model.TokenPair{}

	err := s.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&session, sessionID).Error; err != nil {
			return shared.ErrSessionNotFound
		}

		session.Revoke()

		if err := tx.Save(&session).Error; err != nil {
			return shared.ErrSessionNotFound
		}

		session, refreshToken, err := model.NewSession(session.UserID, c.Request.UserAgent(), c.ClientIP())
		if err != nil {
			return err
		}
		tokenPair.RefreshToken = refreshToken

		if err := tx.Create(&session).Error; err != nil {
			return shared.ErrCommon
		}

		accessToken, err := model.GenerateAccessToken(session.UserID, session.ID)
		if err != nil {
			return err
		}
		tokenPair.AccessToken = accessToken

		err = saveRefreshToken(c, refreshToken)
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	c.JSON(http.StatusOK, shared.Response[model.TokenPair]{
		Data: tokenPair,
	})
}

func saveRefreshToken(c *gin.Context, refreshToken string) error {
	ses := sessions.Default(c)
	ses.Set("refresh_token", refreshToken)
	err := ses.Save()
	if err != nil {
		logger.Log.Error(err.Error())
		return shared.ErrCommon
	}
	return nil
}

func (s AuthenticationService) ForgotPassword(c *gin.Context) {
	body := &dto.ForgotPasswordRequest{}
	if err := c.ShouldBindJSON(body); err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrBadRequest)
		return
	}

	user := &model.User{Email: body.Email}
	if err := s.DB.First(user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusOK, shared.Empty{})
			return
		}
		c.JSON(http.StatusBadRequest, shared.ErrCommon)
		return
	}

	err, otp, code := model.NewOTP(user.ID, model.OTPPurposeResetPassword)
	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	if err := s.DB.Create(otp).Error; err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrCommon)
		return
	}

	s.MessageBus.Dispatch(dto.UserForgotPasswordRequested{
		UserName: user.Name,
		Email:    user.Email,
		EmailOTP: code,
	})

	c.JSON(http.StatusOK, shared.Response[uint]{
		Data: otp.ID,
	})
}

func (s AuthenticationService) ConfirmForgotPassword(c *gin.Context) {
	body := &dto.ConfirmForgotPasswordRequest{}
	if err := c.ShouldBindJSON(body); err != nil {
		c.JSON(http.StatusBadRequest, shared.ErrBadRequest)
		return
	}

	if body.Password != body.PasswordConfirmation {
		c.JSON(http.StatusBadRequest, shared.ErrPasswordNotMatch)
		return
	}

	err := s.DB.Transaction(func(tx *gorm.DB) error {
		otp := &model.OTP{}
		otp.ID = body.OtpID
		if err := tx.First(otp).Error; err != nil {
			return shared.ErrOTPInvalid
		}

		if err := otp.Verify(body.OTP); err != nil {
			return err
		}

		if err := tx.Save(otp).Error; err != nil {
			return shared.ErrCommon
		}

		user := &model.User{}
		if err := tx.First(user, otp.UserID).Error; err != nil {
			return shared.ErrUserNotFound
		}

		if err := user.SetPassword(body.Password); err != nil {
			return err
		}

		if err := tx.Save(user).Error; err != nil {
			return shared.ErrCommon
		}

		// revoke all active sessions
		tx.Model(&model.Session{}).
			Where("user_id = ?", user.ID).
			Update("revoked_at", time.Now())

		return nil
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	c.JSON(http.StatusOK, shared.Empty{})
}
