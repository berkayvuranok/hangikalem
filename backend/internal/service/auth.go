package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"hangikalem/internal/config"
	"hangikalem/internal/db/sqlc"
	"hangikalem/internal/model"
	"hangikalem/internal/repository"
	"hangikalem/internal/utils"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type AuthService struct {
	store *repository.Store
	cfg   config.Config
}

func NewAuthService(store *repository.Store, cfg config.Config) *AuthService {
	return &AuthService{store: store, cfg: cfg}
}

type TokenPair struct {
	AccessToken  string            `json:"access_token"`
	RefreshToken string            `json:"-"`
	User         model.UserResponse `json:"user"`
}

func (s *AuthService) Register(ctx context.Context, name, email, password string) (TokenPair, error) {
	name = strings.TrimSpace(name)
	email = strings.ToLower(strings.TrimSpace(email))
	if name == "" || !strings.Contains(email, "@") || len(password) < 8 {
		return TokenPair{}, ErrInvalid
	}
	hash, err := utils.HashPassword(password)
	if err != nil {
		return TokenPair{}, err
	}
	user, err := s.store.CreateUser(ctx, sqlc.CreateUserParams{
		Email:        email,
		PasswordHash: hash,
		Name:         name,
		Role:         "user",
	})
	if err != nil {
		return TokenPair{}, ErrConflict
	}
	return s.issue(ctx, user)
}

func (s *AuthService) Login(ctx context.Context, email, password string) (TokenPair, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	user, err := s.store.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return TokenPair{}, ErrUnauthorized
		}
		return TokenPair{}, err
	}
	if err := utils.CheckPassword(user.PasswordHash, password); err != nil {
		return TokenPair{}, ErrUnauthorized
	}
	return s.issue(ctx, user)
}

func (s *AuthService) Refresh(ctx context.Context, raw string) (TokenPair, error) {
	if raw == "" {
		return TokenPair{}, ErrUnauthorized
	}
	row, err := s.store.GetRefreshTokenByHash(ctx, utils.HashToken(raw))
	if err != nil {
		return TokenPair{}, ErrUnauthorized
	}
	if !row.ExpiresAt.Valid || row.ExpiresAt.Time.Before(time.Now()) {
		_ = s.store.DeleteRefreshToken(ctx, row.TokenHash)
		return TokenPair{}, ErrUnauthorized
	}
	user, err := s.store.GetUserByID(ctx, row.UserID)
	if err != nil {
		return TokenPair{}, ErrUnauthorized
	}
	_ = s.store.DeleteRefreshToken(ctx, row.TokenHash)
	return s.issue(ctx, user)
}

func (s *AuthService) Logout(ctx context.Context, raw string) error {
	if raw == "" {
		return nil
	}
	return s.store.DeleteRefreshToken(ctx, utils.HashToken(raw))
}

func (s *AuthService) Me(ctx context.Context, id uuid.UUID) (model.UserResponse, error) {
	u, err := s.store.GetUserByID(ctx, id)
	if err != nil {
		return model.UserResponse{}, ErrNotFound
	}
	return model.UserResponse{ID: u.ID, Email: u.Email, Name: u.Name, Role: u.Role}, nil
}

func (s *AuthService) ListUsers(ctx context.Context) ([]model.AdminUser, error) {
	rows, err := s.store.ListUsersAdmin(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]model.AdminUser, 0, len(rows))
	for _, r := range rows {
		created := ""
		if r.CreatedAt.Valid {
			created = r.CreatedAt.Time.UTC().Format("2006-01-02T15:04:05Z")
		}
		out = append(out, model.AdminUser{
			ID:            r.ID,
			Email:         r.Email,
			Name:          r.Name,
			Role:          r.Role,
			CreatedAt:     created,
			ReviewCount:   int(r.ReviewCount),
			FavoriteCount: int(r.FavoriteCount),
		})
	}
	return out, nil
}

func (s *AuthService) issue(ctx context.Context, user sqlc.User) (TokenPair, error) {
	access, err := utils.SignAccessToken(s.cfg.JWTSecret, user.ID, user.Email, user.Role, s.cfg.AccessTokenTTL)
	if err != nil {
		return TokenPair{}, err
	}
	raw, err := utils.RandomToken()
	if err != nil {
		return TokenPair{}, err
	}
	_, err = s.store.CreateRefreshToken(ctx, sqlc.CreateRefreshTokenParams{
		UserID:    user.ID,
		TokenHash: utils.HashToken(raw),
		ExpiresAt: timestamptz(time.Now().Add(s.cfg.RefreshTokenTTL)),
	})
	if err != nil {
		return TokenPair{}, err
	}
	return TokenPair{
		AccessToken:  access,
		RefreshToken: raw,
		User:         model.UserResponse{ID: user.ID, Email: user.Email, Name: user.Name, Role: user.Role},
	}, nil
}
