package service

import (
	"app/shared"
	"bytes"
	"embed"
	"html/template"

	"github.com/go-mail/mail/v2"
)

//go:embed templates/*.html
var templateFS embed.FS

var templates = template.Must(
	template.New("").ParseFS(templateFS,
		"templates/layout.html",
		"templates/otp_register.html",
		"templates/otp_forgot_password.html",
		"templates/otp_set_txpin.html",
	),
)

type mailService struct {
	dialer *mail.Dialer
	from   string
}

func newMailService() *mailService {
	return &mailService{
		from: "noreply@example.com",
		dialer: mail.NewDialer(
			"smtp.gmail.com",
			587,
			"luongkhacnam222@gmail.com",
			shared.Configs.MailPassword,
		),
	}
}

func (m *mailService) send(to, subject, body string) error {
	msg := mail.NewMessage()

	msg.SetHeader("From", m.from)
	msg.SetHeader("To", to)
	msg.SetHeader("Subject", subject)
	msg.SetBody("text/html", body)

	return m.dialer.DialAndSend(msg)
}

func (m *mailService) injectMailTemplate(name string, data any) (string, error) {
	var buf bytes.Buffer

	err := templates.ExecuteTemplate(&buf, name, data)
	if err != nil {
		return "", err
	}

	return buf.String(), nil
}
