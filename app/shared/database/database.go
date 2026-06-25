package database

import (
	"app/identity/model"
	"app/shared"
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect() (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=%s",
		shared.Configs.DbHost,
		shared.Configs.DbUser,
		shared.Configs.DbPass,
		shared.Configs.DbName,
		shared.Configs.DbPort,
		shared.Configs.TimeZone,
	)

	return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}

func Migrate(db *gorm.DB) error {
	if shared.Configs.AutoMigrate {
		err := db.AutoMigrate(
			model.User{},
			model.Session{},
			model.TransactionPin{},
			model.OTP{},
			model.Session{})
		if err != nil {
			return err
		}
	}
	return nil
}
