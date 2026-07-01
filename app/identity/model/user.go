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

func (u *User) VerifyPassword(password string) error {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	if err != nil {
		return shared.ErrUserIncorrectPassword
	}
	return nil
}

func (u *User) VerifyActive() error {
	if u.IsPending() {
		return shared.ErrUserNotActive
	}

	if u.isLocked() {
		return shared.ErrUserLocked
	}

	if u.isSuspended() {
		return shared.ErrUserSuspended
	}

	if u.isDeleted() {
		return shared.ErrUserDeleted
	}

	return nil
}

func (u *User) ChangeStatus(status UserStatus) error {
	if _, ok := allowedTransitions[u.Status][status]; !ok {
		return shared.ErrUserInvalidStatus
	}
	u.Status = status
	return nil
}

func (u *User) ConfirmSignup(password string) error {
	if !u.IsPending() {
		return shared.ErrUserInvalidStatus
	}
	err := u.ChangeStatus(UserStatusActive)
	if err != nil {
		return err
	}
	if err := u.SetPassword(password); err != nil {
		return err
	}
	return nil
}

func (u *User) IsPending() bool {
	return u.Status == UserStatusPending
}

func (u *User) IsAllowedCreateWallet() bool {
	return u.isActive()
}

func (u *User) isActive() bool {
	return u.Status == UserStatusActive
}

func (u *User) isSuspended() bool {
	return u.Status == UserStatusSuspended
}

func (u *User) isLocked() bool {
	return u.Status == UserStatusLocked
}

func (u *User) isDeleted() bool {
	return u.Status == UserStatusDeleted
}
