package shared

import "github.com/golang-jwt/jwt/v5"

type Pagination[T any] struct {
	Page  int `json:"page"`
	Size  int `json:"size"`
	Total int `json:"total"`
	Items []T
}

type Cursor[T any] struct {
	Next  int `json:"next"`
	Prev  int `json:"prev"`
	Items []T
}

type Empty struct{}

type AccessTokenClaims struct {
	UserID    uint `json:"user_id"`
	SessionID uint `json:"session_id"`
	jwt.RegisteredClaims
}

type Response[T any] struct {
	Data T `json:"data"`
}
