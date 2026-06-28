package model

import (
	"app/shared"
	"crypto/rand"
	"fmt"
	"math/big"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type OTPPurpose string

const (
	OTPPurposeRegister          OTPPurpose = "REGISTER"
	OTPPurposeLogin             OTPPurpose = "LOGIN"
	OTPPurposeResetPassword     OTPPurpose = "RESET_PASSWORD"
	OTPPurposeTransfer          OTPPurpose = "TRANSFER"
	OTPPurposeSetTransactionPIN OTPPurpose = "SET_TRANSACTION_PIN"
)

const OTPExpiredMinutes = 5

type OTP struct {
	gorm.Model

	UserID     uint       `gorm:"not null;index"`
	Code       string     `gorm:"size:255;not null"`
	Purpose    OTPPurpose `gorm:"size:30;not null"`
	ExpiredAt  time.Time  `gorm:"not null"`
	VerifiedAt *time.Time

	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;"`
}

func NewOTP(
	userID uint,
	purpose OTPPurpose,
) (error, *OTP, string) {
	code, err := generateOTP()
	if err != nil {
		return shared.ErrCommon, nil, ""
	}

	e, hashedCode := hashOTP(code)
	if e != nil {
		return shared.ErrCommon, nil, ""
	}

	return nil,
		&OTP{
			Code:      hashedCode,
			Purpose:   purpose,
			ExpiredAt: time.Now().Add(time.Duration(OTPExpiredMinutes) * time.Minute),
			UserID:    userID,
		}, code
}

func (o *OTP) CanVerify(otp string) error {
	if o.isExpired() {
		return shared.ErrOTPExpired
	}
	if o.isVerified() {
		return shared.ErrOTPInvalid
	}

	err := bcrypt.CompareHashAndPassword([]byte(o.Code), []byte(otp))
	if err != nil {
		return shared.ErrOTPInvalid
	}

	return nil
}

func (o *OTP) Verify(otp string) error {
	if err := o.CanVerify(otp); err != nil {
		return err
	}
	o.VerifiedAt = new(time.Now())
	return nil
}

func (o *OTP) isExpired() bool {
	return time.Now().After(o.ExpiredAt)
}

func (o *OTP) isVerified() bool {
	return o.VerifiedAt != nil
}

func hashOTP(OTP string) (error, string) {
	hashedOTP, err := bcrypt.GenerateFromPassword([]byte(OTP), bcrypt.DefaultCost)
	if err != nil {
		return shared.ErrCommon, ""
	}
	return nil, string(hashedOTP)
}

func generateOTP() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("%06d", n.Int64()), nil
}
