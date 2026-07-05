package shared

import (
	"bufio"
	"os"
	"strconv"
	"strings"
)

type appEnv string

const (
	AppEnvDevelopment appEnv = "development"
	AppEnvProduction  appEnv = "production"
)

type config struct {
	DbHost        string
	DbPort        string
	DbUser        string
	DbPass        string
	DbName        string
	TimeZone      string
	JWTSecret     string
	AutoMigrate   bool
	Port          int
	AppEnv        appEnv
	SessionSecret string
	MailPassword  string
}

var Configs config

func init() {
	// Tải file .env từ nhiều vị trí có thể để đảm bảo hoạt động trong mọi môi trường chạy (GoLand, Terminal, v.v.)
	loadEnv(".env")
	loadEnv("app/.env")
	loadEnv("../.env")

	Configs = config{
		DbHost:        getEnv("DB_HOST", "localhost"),
		DbPort:        getEnv("DB_PORT", "5432"),
		DbUser:        getEnv("DB_USER", "ewallet"),
		DbPass:        getEnv("DB_PASS", "ewallet_password"),
		DbName:        getEnv("DB_NAME", "ewallet_db"),
		TimeZone:      getEnv("TIME_ZONE", "Asia/Ho_Chi_Minh"),
		JWTSecret:     getEnv("JWT_SECRET", "default_jwt_secret_key_please_change_in_production"),
		AutoMigrate:   getEnvBool("AUTO_MIGRATE", true),
		Port:          getEnvInt("PORT", 8080),
		AppEnv:        appEnv(getEnv("APP_ENV", "development")),
		SessionSecret: getEnv("SESSION_SECRET", "default_session_secret_key"),
		MailPassword:  getEnv("MAIL_PASSWORD", ""),
	}
}

// loadEnv đọc file cấu hình .env thủ công bằng standard library để tránh phụ thuộc gói ngoài
func loadEnv(filepath string) {
	file, err := os.Open(filepath)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])

		// Loại bỏ dấu nháy kép hoặc nháy đơn bọc ngoài giá trị nếu có
		if len(val) >= 2 {
			if (strings.HasPrefix(val, "\"") && strings.HasSuffix(val, "\"")) ||
				(strings.HasPrefix(val, "'") && strings.HasSuffix(val, "'")) {
				val = val[1 : len(val)-1]
			}
		}

		// Chỉ ghi đè nếu biến môi trường này chưa được set
		if os.Getenv(key) == "" {
			os.Setenv(key, val)
		}
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	valueStr := getEnv(key, "")
	if value, err := strconv.ParseBool(valueStr); err == nil {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return fallback
}
