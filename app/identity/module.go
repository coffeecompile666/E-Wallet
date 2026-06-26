package identity

import (
	"app/identity/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Module struct {
	AuthenticationService *service.AuthenticationService
}

func NewModule(db *gorm.DB) Module {
	return Module{
		AuthenticationService: &service.AuthenticationService{DB: db},
	}
}

func (m Module) Boostrap(r *gin.RouterGroup) {
	authenticationService := m.AuthenticationService

	r.POST("/signup", authenticationService.Signup)
}
