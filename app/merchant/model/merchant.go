package model

import (
	"app/identity/model"
	"app/shared"
	"crypto/rand"
	"encoding/base64"

	"golang.org/x/crypto/ed25519"
	"gorm.io/gorm"
)

type Merchant struct {
	gorm.Model

	Name      string `gorm:"type:varchar(255);not null"`
	PublicKey string `gorm:"type:varchar(255);not null"`
	UserID    uint   `gorm:"not null"`

	User model.User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
}

func (m *Merchant) RotateMerchantKey() (string, error) {
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return "", shared.ErrMerchantKeyRotate
	}

	// Lưu public key vào DB
	m.PublicKey = base64.StdEncoding.EncodeToString(publicKey)

	// Trả private key cho merchant
	return base64.StdEncoding.EncodeToString(privateKey), nil
}

func (m *Merchant) VerifySignature(message []byte, signatureBase64 string) error {
	publicKey, err := base64.StdEncoding.DecodeString(m.PublicKey)
	if err != nil {
		return shared.ErrMerchantInvalidPublicKey
	}

	signature, err := base64.StdEncoding.DecodeString(signatureBase64)
	if err != nil {
		return shared.ErrMerchantInvalidSignature
	}

	if len(publicKey) != ed25519.PublicKeySize {
		return shared.ErrMerchantInvalidPublicKey
	}

	if len(signature) != ed25519.SignatureSize {
		return shared.ErrMerchantInvalidSignature
	}

	if !ed25519.Verify(
		ed25519.PublicKey(publicKey),
		message,
		signature,
	) {
		return shared.ErrMerchantInvalidSignature
	}

	return nil
}
