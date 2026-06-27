package logger

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"runtime"
	"strings"

	"github.com/gin-gonic/gin"
)

func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				Log.Error(
					"panic",
					slog.Any("err", err),
				)

				printStack()

				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"dto": "Internal server error",
				})
			}
		}()

		c.Next()
	}
}

func printStack() {
	const depth = 16

	pcs := make([]uintptr, depth)
	n := runtime.Callers(3, pcs)

	frames := runtime.CallersFrames(pcs[:n])

	_, err := fmt.Fprintln(os.Stderr, "Stack Trace:")
	if err != nil {
		return
	}

	for {
		frame, more := frames.Next()

		if strings.Contains(frame.File, "/app/") {
			file := frame.File
			if idx := strings.Index(file, "/app/"); idx != -1 {
				file = file[idx+5:]
			}

			_, err := fmt.Fprintf(
				os.Stderr,
				"  %s:%d\n      %s\n",
				file,
				frame.Line,
				frame.Function,
			)
			if err != nil {
				return
			}
		}

		if !more {
			break
		}
	}
}
