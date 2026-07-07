package service

import (
	"app/identity/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserService struct {
	DB *gorm.DB
}

func NewUserService(db *gorm.DB) *UserService {
	return &UserService{DB: db}
}

func (u *UserService) Search(c *gin.Context) {
	search := c.Query("search")

	var users []model.User
	u.DB.Where("name LIKE ? OR email LIKE ?", "%"+search+"%", "%"+search+"%").Limit(10).Find(&users)
	c.JSON(200, gin.H{"users": users})
}
