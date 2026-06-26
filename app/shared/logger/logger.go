package logger

import (
	"log/slog"
	"os"
	"path/filepath"

	"github.com/lmittmann/tint"
)

var Log *slog.Logger

func Init() {
	Log = slog.New(tint.NewHandler(os.Stdout, &tint.Options{
		Level:      slog.LevelDebug,
		AddSource:  true,
		TimeFormat: "[2006-01-02 15:04:05]",

		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			if a.Key == slog.SourceKey {
				source := a.Value.Any().(*slog.Source)
				source.File = filepath.Base(source.File)
			}
			return a
		},
	}))

	slog.SetDefault(Log)
}
