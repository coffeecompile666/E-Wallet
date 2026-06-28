package middleware

import (
	"app/shared"
	"app/shared/logger"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const (
	headerAuthorization = "Authorization"
)

type httpMethod string

const (
	post   httpMethod = "POST"
	put    httpMethod = "PUT"
	patch  httpMethod = "PATCH"
	remove httpMethod = "DELETE"
	get    httpMethod = "GET"
)

var publicRoutes = map[httpMethod]map[string]bool{
	post: {
		"/api/v1/signup":                  true,
		"/api/v1/confirm-signup":          true,
		"/api/v1/verify-otp":              true,
		"/api/v1/signin":                  true,
		"/api/v1/forgot-password":         true,
		"/api/v1/confirm-forgot-password": true,
	},
}

func ValidateToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Request.URL.Path
		method := httpMethod(c.Request.Method)

		if publicRoutes[method][path] {
			c.Next()
			return
		}

		logger.Log.Info("check token")
		tokenString := extractToken(c)
		claims, err := parseAccessToken(tokenString, shared.Configs.JWTSecret)

		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, err)
			return
		}

		c.Set(shared.ContextUserID, claims.UserID)
		c.Set(shared.ContextSessionID, claims.SessionID)
		// userID := c.mustGet(shared.ContextUserID).(uint)
		c.Next()
	}
}

func extractToken(c *gin.Context) string {
	authHeader := c.Request.Header.Get(headerAuthorization)

	if authHeader == "" {
		return ""
	}

	token, ok := strings.CutPrefix(authHeader, "Bearer ")
	if !ok {
		return ""
	}

	return token
}

func parseAccessToken(tokenString, secret string) (*shared.AccessTokenClaims, error) {
	claims := &shared.AccessTokenClaims{}

	token, err := jwt.ParseWithClaims(
		tokenString,
		claims,
		func(token *jwt.Token) (any, error) {
			if token.Method != jwt.SigningMethodHS256 {
				logger.Log.Warn("Unexpected signing method")
				return nil, shared.ErrInvalidAccessToken
			}
			return []byte(secret), nil
		},
	)

	if err != nil {
		switch {
		case errors.Is(err, jwt.ErrTokenExpired):
			return nil, shared.ErrExpiredAccessToken

		case errors.Is(err, jwt.ErrTokenNotValidYet):
			return nil, shared.ErrInvalidAccessToken

		default:
			return nil, shared.ErrInvalidAccessToken
		}
	}

	if !token.Valid {
		return nil, shared.ErrExpiredAccessToken
	}

	return claims, nil
}
