package model

import (
	"app/shared"
	"regexp"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const TransactionPinMaxFailedAttempts = 3
const TransactionPinLockDuration = 10 * time.Minute

var txPinRegex = regexp.MustCompile(`^\d{6}$`)

type TransactionPin struct {
	gorm.Model

	PinHash        string `gorm:"type:varchar(255);not null"`
	UserID         uint   `gorm:"not null;uniqueIndex"`
	FailedAttempts int
	LockedUntil    *time.Time
}

func NewTransactionPin(userID uint, Pin string) (*TransactionPin, error) {
	pinHash, err := HashTransactionPIN(Pin)
	if err != nil {
		return nil, shared.ErrCommon
	}

	return &TransactionPin{
		UserID:         userID,
		PinHash:        pinHash,
		FailedAttempts: 0,
	}, nil
}

func (t *TransactionPin) Verify(pin string) error {
	if t.isLocked() {
		return shared.ErrTransactionPinLocked
	}

	if bcrypt.CompareHashAndPassword([]byte(t.PinHash), []byte(pin)) != nil {
		t.incrementFailedAttempts()
		if t.FailedAttempts >= TransactionPinMaxFailedAttempts {
			t.lock()
			return shared.ErrTransactionPinLocked
		}

		return shared.ErrTransactionPinIncorrect
	}

	t.FailedAttempts = 0
	t.unlock()

	return nil
}

func (t *TransactionPin) Change(pin string) error {
	pinHash, err := HashTransactionPIN(pin)
	if err != nil {
		return shared.ErrCommon
	}

	t.PinHash = pinHash

	return nil
}

func HashTransactionPIN(pin string) (string, error) {
	if !txPinRegex.MatchString(pin) {
		return "", shared.ErrTransactionPinInvalid
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(pin), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	return string(hash), nil
}

func (t *TransactionPin) incrementFailedAttempts() {
	t.FailedAttempts++
}

func (t *TransactionPin) isLocked() bool {
	return t.LockedUntil != nil && t.LockedUntil.After(time.Now())
}

func (t *TransactionPin) unlock() {
	t.LockedUntil = nil
}

func (t *TransactionPin) lock() {
	t.LockedUntil = new(time.Now().Add(TransactionPinLockDuration))
}
