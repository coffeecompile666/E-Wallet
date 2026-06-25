package identity

import (
	"app/identity/service"

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
