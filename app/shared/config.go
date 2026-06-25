package shared

type Config struct {
	DbHost      string
	DbPort      string
	DbUser      string
	DbPass      string
	DbName      string
	TimeZone    string
	JWTSecret   string
	AutoMigrate bool
}

var Configs Config = Config{
	DbHost:      "localhost",
	DbPort:      "5432",
	DbUser:      "ewallet",
	DbPass:      "ewallet_password",
	DbName:      "ewallet_db ",
	TimeZone:    "Asia/Ho_Chi_Minh",
	JWTSecret:   "ooooo332322@@@@@",
	AutoMigrate: true,
}
