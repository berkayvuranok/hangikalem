package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"hangikalem/internal/config"
	"hangikalem/internal/handler"
	"hangikalem/internal/repository"
	"hangikalem/internal/seed"
	"hangikalem/internal/service"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	if err := runMigrations(cfg.DatabaseURL); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer pool.Close()
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("db ping: %v", err)
	}

	store := repository.New(pool)
	if err := seed.Run(ctx, store); err != nil {
		log.Fatalf("seed: %v", err)
	}

	var rdb *redis.Client
	opt, err := redis.ParseURL(cfg.RedisURL)
	if err == nil {
		rdb = redis.NewClient(opt)
		if err := rdb.Ping(ctx).Err(); err != nil {
			log.Printf("redis unavailable, rate limit disabled: %v", err)
			rdb = nil
		}
	}

	api := &handler.API{
		Pens: service.NewPenService(store),
		Auth: service.NewAuthService(store, cfg),
		Cfg:  cfg,
		Sync: func(ctx context.Context) error {
			return seed.Run(ctx, store)
		},
	}

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           api.Router(rdb),
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Printf("hangikalem api listening on :%s", cfg.Port)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}

func runMigrations(dbURL string) error {
	source := "file://migrations"
	if _, err := os.Stat("migrations"); err != nil {
		source = "file:///app/migrations"
	}
	m, err := migrate.New(source, dbURL)
	if err != nil {
		return err
	}
	defer m.Close()
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return err
	}
	return nil
}
