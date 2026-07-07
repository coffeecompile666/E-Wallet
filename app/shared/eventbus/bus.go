package eventbus

type EventBus interface {
	Publish(Event)
	Subscribe(Event, Handler)
}

type Event interface{}

type Handler func(Event) error
