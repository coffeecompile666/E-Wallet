package eventbus

import (
	"app/shared/logger"
	"reflect"
)

type InMemoryEventBus struct {
	handlers map[reflect.Type][]Handler
}

func NewInMemoryEventBus() *InMemoryEventBus {
	return &InMemoryEventBus{
		handlers: make(map[reflect.Type][]Handler),
	}
}

func (i *InMemoryEventBus) Publish(event Event) {
	handlers := i.handlers[reflect.TypeOf(event)]
	// fire and forget
	go func() {
		for _, h := range handlers {
			if err := h(event); err != nil {
				logger.Log.Error("[EVENTBUS ERR]", err)
			}
		}
	}()
}

func (i *InMemoryEventBus) Subscribe(event Event, handler Handler) {
	name := reflect.TypeOf(event)
	i.handlers[name] = append(i.handlers[name], handler)
}
