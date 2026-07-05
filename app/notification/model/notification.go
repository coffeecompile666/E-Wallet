package model

import (
	"app/identity/model"

	"gorm.io/gorm"
)

type Notification struct {
	gorm.Model

	Content string `gorm:"type:text"`
	UserID  uint   `gorm:"not null;index"`

	User model.User `gorm:"foreignKey:UserID"`
}
