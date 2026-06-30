package model

import "gorm.io/gorm"

type PaymentType string

const (
	IN  PaymentType = "IN"
	OUT PaymentType = "OUT"
)

type PaymentStatus string

const (
	PENDING PaymentStatus = "PENDING"
	SUCCESS PaymentStatus = "SUCCESS"
	FAILED  PaymentStatus = "FAILED"
)

type Payment struct {
	gorm.Model
	Amount     int64         `gorm:"type:bigint(20);not null"`
	TransferID uint          `gorm:"not null"`
	Type       PaymentType   `gorm:"type:varchar(20);not null"`
	Status     PaymentStatus `gorm:"type:varchar(20);not null"`
}
