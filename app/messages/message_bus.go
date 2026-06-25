package messages

import "log"

type MessageBus struct {
	handlers map[string][]Handler
}

type Handler func(event Event) error

func NewMessageBus() *MessageBus {
	return &MessageBus{
		handlers: make(map[string][]Handler),
	}
}

func (m *MessageBus) Dispatch(event Event) {
	for _, handler := range m.handlers[event.getNames()] {
		go func() {
			e := handler(event)
			if e != nil {
				log.Println(e)
			}
		}()
	}
}
