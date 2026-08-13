package config

import (
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port            string
	DatabaseURL     string
	RedisURL        string
	JWTSecret       string
	FrontendURL     string
	Env             string
	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration
}

func Load() Config {
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")

	return Config{
		Port:            get("PORT", "8080"),
		DatabaseURL:     get("DATABASE_URL", "postgres://hangikalem:hangikalem@localhost:5432/hangikalem?sslmode=disable"),
		RedisURL:        get("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:       get("JWT_SECRET", "dev-only-change-in-production"),
		FrontendURL:     get("FRONTEND_URL", "http://localhost:5173"),
		Env:             get("ENV", "development"),
		AccessTokenTTL:  15 * time.Minute,
		RefreshTokenTTL: 7 * 24 * time.Hour,
	}
}

func (c Config) IsDev() bool {
	return c.Env != "production"
}

func get(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
