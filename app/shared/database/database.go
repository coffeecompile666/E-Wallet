package database

import (
	"app/identity/model"
	model4 "app/notification/model"
	model2 "app/payment/model"
	"app/shared"
	model3 "app/wallet/model"
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
			model2.LinkedBankAccount{},
			model2.Payment{},
			model3.Account{},
			model3.JournalEntry{},
			model3.LedgerEntry{},
			model3.Wallet{},
			model3.Transfer{},
			model4.Notification{},
		)
		if err != nil {
			return err
		}
	}
	return nil
}
