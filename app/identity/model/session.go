package model

import (
	"app/shared"
	"crypto/rand"
	"encoding/base64"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const RefreshTokenExpiresInHours = 30 * 24 * time.Hour
const AccessTokenExpiresInHours = 24 * time.Hour

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

type Session struct {
	gorm.Model

	UserID           uint      `gorm:"not null;index"`
	RefreshTokenHash string    `gorm:"size:64;uniqueIndex;not null"`
	ExpiredAt        time.Time `gorm:"not null"`
	RevokedAt        *time.Time
	DeviceName       string
	UserAgent        string
	IP               string
	User             User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;"`
}

func NewSession(userID uint, userAgent, ip string) (*Session, string, error) {
	refreshToken, err := generateRefreshToken()
	if err != nil {
		return nil, "", shared.ErrCommon
	}

	hashedRefreshToken, err := bcrypt.GenerateFromPassword([]byte(refreshToken), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", shared.ErrCommon
	}

	return &Session{
		UserID:           userID,
		UserAgent:        userAgent,
		IP:               ip,
		ExpiredAt:        time.Now().Add(RefreshTokenExpiresInHours),
		RefreshTokenHash: string(hashedRefreshToken),
	}, refreshToken, nil
}

func (s *Session) VerifyRefreshToken(refreshToken string) error {
	err := bcrypt.CompareHashAndPassword([]byte(s.RefreshTokenHash), []byte(refreshToken))
	if err != nil {
		return shared.ErrInvalidRefreshToken
	}

	now := time.Now()
	if s.ExpiredAt.Before(now) {
		return shared.ErrExpiredRefreshToken
	}

	if s.RevokedAt != nil && s.RevokedAt.After(now) {
		return shared.ErrExpiredRefreshToken
	}

	return nil
}

func (s *Session) Revoke() {
	if s.RevokedAt != nil {
		return
	}

	if isExpired(*s.RevokedAt) {
		return
	}

	s.RevokedAt = new(time.Now())
}

func GenerateAccessToken(userID uint, sessionID uint) (string, error) {
	claims := shared.AccessTokenClaims{
		UserID:    userID,
		SessionID: sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(AccessTokenExpiresInHours)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(shared.Configs.JWTSecret))
}

func generateRefreshToken() (string, error) {
	b := make([]byte, 32)

	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(b), nil
}

func isExpired(t time.Time) bool {
	return time.Now().After(t)
}
