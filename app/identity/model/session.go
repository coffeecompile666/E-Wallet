package model

import (
	"app/shared"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const RefreshTokenExpiresInHours = 30 * 24 * time.Hour
const AccessTokenExpiresInHours = 24 * time.Hour

type AccessTokenClaims struct {
	UserID uint `json:"user_id"`
	jwt.RegisteredClaims
}

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

func NewSession(userID uint, userAgent, ip string) (*Session, TokenPair, error) {
	accessToken, err := generateAccessToken(userID, shared.Configs.JWTSecret)
	if err != nil {
		return nil, TokenPair{}, shared.ErrCommon
	}

	refreshToken, err := generateRefreshToken()
	if err != nil {
		return nil, TokenPair{}, shared.ErrCommon
	}

	hashedRefreshToken, err := bcrypt.GenerateFromPassword([]byte(refreshToken), bcrypt.DefaultCost)
	if err != nil {
		return nil, TokenPair{}, shared.ErrCommon
	}

	return &Session{
		UserID:           userID,
		UserAgent:        userAgent,
		IP:               ip,
		ExpiredAt:        time.Now().Add(RefreshTokenExpiresInHours),
		RefreshTokenHash: string(hashedRefreshToken),
	}, TokenPair{AccessToken: accessToken, RefreshToken: refreshToken}, nil
}

func VerifyAccessToken(tokenString string, secret string) (*AccessTokenClaims, error) {
	token, err := jwt.ParseWithClaims(
		tokenString,
		&AccessTokenClaims{},
		func(token *jwt.Token) (interface{}, error) {
			if token.Method != jwt.SigningMethodHS256 {
				return nil, shared.ErrInvalidAccessToken
			}
			return []byte(secret), nil
		},
	)

	if err != nil {
		switch {
		case errors.Is(err, jwt.ErrTokenExpired):
			return nil, shared.ErrExpiredAccessToken

		case errors.Is(err, jwt.ErrTokenMalformed),
			errors.Is(err, jwt.ErrTokenSignatureInvalid),
			errors.Is(err, jwt.ErrTokenInvalidClaims),
			errors.Is(err, jwt.ErrTokenUnverifiable):
			return nil, shared.ErrInvalidAccessToken

		default:
			return nil, shared.ErrInvalidAccessToken
		}
	}

	claims, ok := token.Claims.(*AccessTokenClaims)
	if !ok || !token.Valid {
		return nil, shared.ErrInvalidAccessToken
	}

	return claims, nil
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
	s.RevokedAt = new(time.Now())
}

func generateRefreshToken() (string, error) {
	b := make([]byte, 32)

	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(b), nil
}

func generateAccessToken(userID uint, secret string) (string, error) {
	claims := AccessTokenClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(AccessTokenExpiresInHours)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(secret))
}
