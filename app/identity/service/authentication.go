package service

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuthenticationService struct {
	DB *gorm.DB
}

func (s AuthenticationService) Signup(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Signup successfulsss"})
}

func (s AuthenticationService) Signing(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Signing successful"})
}

func (s AuthenticationService) Signout(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Signout successful"})
}

func (s AuthenticationService) RefreshToken(c *gin.Context) {
	c.JSON(200, gin.H{"message": "RefreshToken successful"})
}
