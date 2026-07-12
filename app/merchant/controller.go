package merchant

import (
	"app/merchant/model"

	"github.com/gin-gonic/gin"
)

type Controller interface {
	PlaceOrder(c *gin.Context)
	RefundOrder(c *gin.Context)
	CreateMerchant(c *gin.Context)
	RotateKey(c *gin.Context)
	PaymentOrder(c *gin.Context)
	GetMerchantByUserID(userID int) (*model.Merchant, error)
	GetMerchantOrdersByUserID(userID int) ([]*model.Order, error)
	Init()
}

type ApiController struct {
	g *gin.RouterGroup
	s *Service
}

func NewApiController(g *gin.RouterGroup, s *Service) *ApiController {
	return &ApiController{g: g, s: s}
}

func (m *ApiController) PlaceOrder(c *gin.Context) {
	//TODO implement me
	panic("implement me")
}

func (m *ApiController) RefundOrder(c *gin.Context) {
	//TODO implement me
	panic("implement me")
}

func (m *ApiController) CreateMerchant(c *gin.Context) {
	//TODO implement me
	panic("implement me")
}

func (m *ApiController) RotateKey(c *gin.Context) {
	//TODO implement me
	panic("implement me")
}

func (m *ApiController) PaymentOrder(c *gin.Context) {
	//TODO implement me
	panic("implement me")
}

func (m *ApiController) Init() {
	m.g.POST("/place-order", m.PlaceOrder)
	m.g.POST("/refund-order", m.RefundOrder)
	m.g.POST("/create-merchant", m.CreateMerchant)
	m.g.POST("/rotate-key", m.RotateKey)
	m.g.POST("/payment-order", m.PaymentOrder)
}
