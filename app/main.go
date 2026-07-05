package main

import (
	"app/event"
	"app/identity"
	"app/messages"
	service2 "app/notification/service"
	"app/payment"
	"app/shared"
	"app/shared/database"
	"app/shared/logger"
	"app/shared/middleware"
	"app/wallet"
	"fmt"
	"os"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
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
	Log := logger.Log

	db, err := database.Connect()
	if err != nil {
		Log.Error(ErrFailedConnectToDb, "err", err)
		os.Exit(1)
	}
	err = database.Migrate(db)
	if err != nil {
		Log.Error(ErrDbMigrationFailed, "err", err)
		os.Exit(1)
	}

	if shared.Configs.AppEnv == shared.AppEnvDevelopment {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}
	router := gin.New()
	router.Use(
		middleware.CORS(),
		middleware.ValidateToken(),
		gin.Logger(),
		logger.Recovery())

	store := cookie.NewStore([]byte(shared.Configs.SessionSecret))
	router.Use(sessions.Sessions("session", store))

	err = router.SetTrustedProxies(nil)
	if err != nil {
		Log.Error(ErrFailedStartServer, "err", err)
	}

	messageBus := messages.NewMessageBus()

	v1 := router.Group("/api/v1")
	identityModule := identity.NewModule(db, messageBus)
	identityModule.Boostrap(v1)
	paymentModule := payment.NewModule(db, messageBus)
	paymentModule.Bootstrap(v1)
	walletModule := wallet.NewModule(db, messageBus, paymentModule)
	walletModule.Bootstrap(v1)
	notificationModule := service2.NewNotificationService(db)

	handler := event.NewHandler(walletModule, identityModule, messageBus, notificationModule)
	handler.Register()

	addr := fmt.Sprintf(":%d", shared.Configs.Port)
	err = router.Run(addr)
	if err != nil {
		Log.Error(ErrFailedStartServer, "err", err)
		os.Exit(1)
	}
}
