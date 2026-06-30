package model

import (
	"app/shared/logger"
	"time"
)

type Gateway struct{}

func NewGateway() *Gateway {
	return &Gateway{}
}

func (gateway *Gateway) Transfer(payment Payment) error {
	// wait 1s and do nothing
	time.Sleep(1 * time.Second)
	// pretend transfer to bank success
	logger.Log.Info("transfer to bank successfully", "payment", payment)

	return nil
}
