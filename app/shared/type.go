package shared

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
