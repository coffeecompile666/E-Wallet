package main

import (
	"app/identity"
	"app/shared"
	"app/shared/database"
	"app/shared/logger"
	"app/shared/middleware"
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
)

const (
	ErrFailedConnectToDb = "failed to connect to database"
	ErrDbMigrationFailed = "database migration failed"
	ErrFailedStartServer = "failed to start server"
	ErrFailedStopServer  = "failed to stop server"
)

func main() {
	logger.Init()

	db, err := database.Connect()
	if err != nil {
		logger.Log.Error(ErrFailedConnectToDb, "err", err)
		os.Exit(1)
	}
	err = database.Migrate(db)
	if err != nil {
		logger.Log.Error(ErrDbMigrationFailed, "err", err)
		os.Exit(1)
	}

	if shared.Configs.AppEnv == shared.AppEnvDevelopment {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}
	router := gin.New()
	router.Use(
		middleware.ValidateToken(),
		gin.Logger(),
		logger.Recovery())
	err = router.SetTrustedProxies(nil)
	if err != nil {
		logger.Log.Error(ErrFailedStartServer, "err", err)
	}

	v1 := router.Group("/api/v1")
	identityModule := identity.NewModule(db)
	identityModule.Boostrap(v1)

	addr := fmt.Sprintf(":%d", shared.Configs.Port)
	err = router.Run(addr)
	if err != nil {
		logger.Log.Error(ErrFailedStartServer, "err", err)
		os.Exit(1)
	}
}
