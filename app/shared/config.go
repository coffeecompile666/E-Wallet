package shared

type appEnv string

const (
	AppEnvDevelopment appEnv = "production"
	AppEnvProduction  appEnv = "development"
)

type config struct {
	DbHost      string
	DbPort      string
	DbUser      string
	DbPass      string
	DbName      string
	TimeZone    string
	JWTSecret   string
	AutoMigrate bool
	Port        int
	AppEnv      appEnv
}

var Configs = config{
	DbHost:      "localhost",
	DbPort:      "5432",
	DbUser:      "ewallet",
	DbPass:      "ewallet_password",
	DbName:      "ewallet_db ",
	TimeZone:    "Asia/Ho_Chi_Minh",
	JWTSecret:   "ooooo332322@@@@@",
	AutoMigrate: true,
	Port:        8080,
	AppEnv:      AppEnvDevelopment,
}
