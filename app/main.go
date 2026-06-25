package main

import (
	"app/identity"
	"app/shared/database"

	"github.com/gin-gonic/gin"
)

func main() {
	db, err := database.Connect()
	if err != nil {
		panic(err)
	}
	err = database.Migrate(db)
	if err != nil {
		panic(err)
	}

	identityModule := identity.NewModule(db)
	authenticationService := identityModule.AuthenticationService

	router := gin.Default()

	v1 := router.Group("/api/v1")

	v1.POST("/signup", authenticationService.Signup)

	err = router.Run()
	if err != nil {
		return
	}
}
