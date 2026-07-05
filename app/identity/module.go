package identity

import (
	"app/identity/service"
	"app/messages"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Module struct {
	AuthenticationService *service.AuthenticationService
	TransactionPinService *service.TransactionPinService
}

func NewModule(db *gorm.DB, messageBus *messages.MessageBus) *Module {
	return &Module{
		AuthenticationService: &service.AuthenticationService{DB: db, MessageBus: messageBus},
		TransactionPinService: &service.TransactionPinService{DB: db, MessageBus: messageBus},
	}
}

func (m Module) Boostrap(r *gin.RouterGroup) {
	authenticationService := m.AuthenticationService
	transactionPinService := m.TransactionPinService

	r.POST("/signup", authenticationService.Signup)
	r.POST("/confirm-signup", authenticationService.ConfirmSignup)
	r.POST("/signin", authenticationService.Signing)
	r.POST("/verify-otp", authenticationService.VerifyOTP)
	r.POST("/logout", authenticationService.Logout)
	r.POST("/forgot-password", authenticationService.ForgotPassword)
	r.POST("/confirm-forgot-password", authenticationService.ConfirmForgotPassword)
	r.POST("/refresh-token", authenticationService.RefreshToken)

	r.POST("/transaction-pin", transactionPinService.Create)
	r.POST("/confirm-transaction-pin", transactionPinService.ConfirmCreate)
}
