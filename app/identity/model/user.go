package model

import (
	"app/shared"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserStatus string

const (
	UserStatusPending   UserStatus = "PENDING"
	UserStatusActive    UserStatus = "ACTIVE"
	UserStatusSuspended UserStatus = "SUSPENDED"
	UserStatusLocked    UserStatus = "LOCKED"
	UserStatusDeleted   UserStatus = "DELETED"
)

var allowedTransitions = map[UserStatus]map[UserStatus]struct{}{
	UserStatusPending: {
		UserStatusActive:    {},
		UserStatusSuspended: {},
		UserStatusLocked:    {},
		UserStatusDeleted:   {},
	},
	UserStatusActive: {
		UserStatusSuspended: {},
		UserStatusLocked:    {},
		UserStatusDeleted:   {},
	},
	UserStatusSuspended: {
		UserStatusActive:  {},
		UserStatusLocked:  {},
		UserStatusDeleted: {},
	},
	UserStatusLocked: {
		UserStatusActive:    {},
		UserStatusSuspended: {},
		UserStatusDeleted:   {},
	},
	UserStatusDeleted: {},
}

type User struct {
	gorm.Model

	Name           string          `gorm:"type:varchar(100);not null"`
	Email          string          `gorm:"type:varchar(150);uniqueIndex;not null"`
	Password       string          `gorm:"type:varchar(255);not null"`
	Status         UserStatus      `gorm:"type:varchar(20);not null;default:'PENDING'"`
	OTPs           []OTP           `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;"`
	TransactionPin *TransactionPin `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;"`
	Sessions       []Session       `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;"`
}

func (u *User) SetPassword(password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return shared.ErrUserIncorrectPassword
	}
	u.Password = string(hash)
	return nil
}

func (u *User) VerifyPassword(password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password)) == nil
}

func (u *User) Activate() {
	u.Status = UserStatusActive
}

func (u *User) Suspend() {
	u.Status = UserStatusSuspended
}

func (u *User) Lock() {
	u.Status = UserStatusLocked
}

func (u *User) IsActive() bool {
	return u.Status == UserStatusActive
}

func (u *User) ChangeStatus(status UserStatus) error {
	if _, ok := allowedTransitions[u.Status][status]; !ok {
		return shared.ErrUserInvalidStatus
	}
	u.Status = status
	return nil
}
