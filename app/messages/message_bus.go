package messages

import (
	"app/shared/logger"
)

type MessageBus struct {
	handlers map[string][]Handler
}

type Handler func(event Event) error

func NewMessageBus() *MessageBus {
	messageBus := &MessageBus{}
	handlers := make(map[string][]Handler)
	messageBus.handlers = handlers

	return messageBus
}

func (m *MessageBus) Dispatch(event Event) {
	for _, handler := range m.handlers[event.Name()] {
		go func() {
			e := handler(event)
			if e != nil {
				logger.Log.Error(e.Error(), "event", event)
			}
		}()
	}
}

func Register[T Event](bus *MessageBus, name string, h func(T) error) {
	bus.handlers[name] = append(bus.handlers[name], func(e Event) error {
		return h(e.(T))
	})
}
