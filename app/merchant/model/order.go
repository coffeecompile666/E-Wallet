package model

import (
	"app/shared"

	"gorm.io/gorm"
)

type status string

const (
	Pending   status = "pending"
	Paid      status = "paid"
	Refunded  status = "refunded"
	Cancelled status = "cancelled"
)

var allowedStatuses = map[status][]status{
	Pending:   []status{Paid, Refunded, Cancelled},
	Paid:      []status{Refunded},
	Refunded:  []status{},
	Cancelled: []status{},
}

type Order struct {
	gorm.Model

	MerchantID uint     `gorm:"index"`
	Merchant   Merchant `gorm:"foreignKey:MerchantID"`
	Amount     uint     `gorm:"not null"`
	Status     status   `gorm:"not null" default:"pending"`
}

func NewOrder(merchantID uint, amount uint) *Order {
	return &Order{
		MerchantID: merchantID,
		Amount:     amount,
		Status:     Pending,
	}
}

func (o *Order) SetPaid() error {
	availableStatuses := allowedStatuses[o.Status]

	for _, status := range availableStatuses {
		if status == Paid {
			o.Status = Paid
			return nil
		}
	}
	return shared.ErrMerchantOrderInvalidStatus
}

func (o *Order) SetRefunded() error {
	availableStatuses := allowedStatuses[o.Status]

	for _, status := range availableStatuses {
		if status == Refunded {
			o.Status = Refunded
			return nil
		}
	}
	return shared.ErrMerchantOrderInvalidStatus
}

func (o *Order) SetCancelled() error {
	availableStatuses := allowedStatuses[o.Status]

	for _, status := range availableStatuses {
		if status == Cancelled {
			o.Status = Cancelled
			return nil
		}
	}
	return shared.ErrMerchantOrderInvalidStatus
}
