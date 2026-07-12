package merchant

import "app/merchant/model"

type Service interface {
	PostCreateMerchant() error
	PostRotateKey() error
	PostPlaceOrder() error
	PostRefundOrder() error
	PostPaymentOrder() error
	GetMerchantByUserID(userID int) (*model.Merchant, error)
	GetMerchantOrdersByUserID(userID int) ([]*model.Order, error)
}
