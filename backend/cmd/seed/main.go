package main

import (
	"context"
	"log"

	"hangikalem/internal/config"
	"hangikalem/internal/repository"
	"hangikalem/internal/seed"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()
	if err := seed.Run(ctx, repository.New(pool)); err != nil {
		log.Fatal(err)
	}
	log.Println("seed complete")
}
