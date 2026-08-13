package service

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"hangikalem/internal/db/sqlc"
	"hangikalem/internal/model"
	"hangikalem/internal/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var ErrNotFound = errors.New("not found")
var ErrInvalid = errors.New("invalid request")
var ErrConflict = errors.New("conflict")
var ErrUnauthorized = errors.New("unauthorized")
var ErrForbidden = errors.New("forbidden")

type PenService struct {
	store *repository.Store
}

func NewPenService(store *repository.Store) *PenService {
	return &PenService{store: store}
}

type PenFilter struct {
	BrandSlug *string
	Type      *string
	InkType   *string
	TipSize   *string
	Color     *string
	MinPrice  *float64
	MaxPrice  *float64
	MinWeight *float64
	MaxWeight *float64
	MinRating *float64
	Purpose   *string
	Page      int
	Limit     int
}

func (s *PenService) List(ctx context.Context, f PenFilter) (model.PaginatedPens, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 {
		f.Limit = 200
	}
	if f.Limit > 500 {
		f.Limit = 500
	}
	lp := toListParams(f)
	rows, err := s.store.ListPens(ctx, lp)
	if err != nil {
		return model.PaginatedPens{}, err
	}
	total, err := s.store.CountPens(ctx, toCountParams(f))
	if err != nil {
		return model.PaginatedPens{}, err
	}
	items := make([]model.PenResponse, 0, len(rows))
	for _, r := range rows {
		items = append(items, toPen(r, s.tags(ctx, r.ID), nil))
	}
	return model.PaginatedPens{Items: items, Total: int(total), Page: f.Page, Limit: f.Limit}, nil
}

func (s *PenService) GetBySlug(ctx context.Context, slug string) (model.PenResponse, error) {
	row, err := s.store.GetPenBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.PenResponse{}, ErrNotFound
		}
		return model.PenResponse{}, err
	}
	return slugPen(row, s.tags(ctx, row.ID), s.features(ctx, row.ID)), nil
}

func (s *PenService) GetByID(ctx context.Context, id uuid.UUID) (model.PenResponse, error) {
	row, err := s.store.GetPenByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.PenResponse{}, ErrNotFound
		}
		return model.PenResponse{}, err
	}
	return idPen(row, s.tags(ctx, row.ID), s.features(ctx, row.ID)), nil
}

func (s *PenService) Popular(ctx context.Context, limit int32) ([]model.PenResponse, error) {
	rows, err := s.store.ListPopularPens(ctx, limit)
	if err != nil {
		return nil, err
	}
	out := make([]model.PenResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, popularPen(r))
	}
	return out, nil
}

func (s *PenService) Brands(ctx context.Context) ([]model.BrandResponse, error) {
	rows, err := s.store.ListBrands(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]model.BrandResponse, 0, len(rows))
	for _, b := range rows {
		out = append(out, brandResp(b))
	}
	return out, nil
}

func (s *PenService) BrandBySlug(ctx context.Context, slug string) (model.BrandResponse, error) {
	b, err := s.store.GetBrandBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.BrandResponse{}, ErrNotFound
		}
		return model.BrandResponse{}, err
	}
	return brandResp(b), nil
}

func (s *PenService) Search(ctx context.Context, q string) (model.SearchResponse, error) {
	q = strings.TrimSpace(q)
	if q == "" {
		return model.SearchResponse{Brands: []model.BrandResponse{}, Pens: []model.PenResponse{}}, nil
	}
	query := ptr(q)
	brands, err := s.store.SearchBrands(ctx, query)
	if err != nil {
		return model.SearchResponse{}, err
	}
	pens, err := s.store.SearchPens(ctx, query)
	if err != nil {
		return model.SearchResponse{}, err
	}
	bOut := make([]model.BrandResponse, 0, len(brands))
	for _, b := range brands {
		bOut = append(bOut, brandResp(b))
	}
	pOut := make([]model.PenResponse, 0, len(pens))
	for _, p := range pens {
		pOut = append(pOut, searchPen(p))
	}
	return model.SearchResponse{Brands: bOut, Pens: pOut}, nil
}

func (s *PenService) Compare(ctx context.Context, slugs []string) (model.CompareResponse, error) {
	if len(slugs) < 2 || len(slugs) > 4 {
		return model.CompareResponse{}, ErrInvalid
	}
	rows, err := s.store.ListPensBySlugs(ctx, slugs)
	if err != nil {
		return model.CompareResponse{}, err
	}
	if len(rows) < 2 {
		return model.CompareResponse{}, ErrInvalid
	}
	pens := make([]model.PenResponse, 0, len(rows))
	for _, r := range rows {
		pens = append(pens, slugListPen(r))
	}
	return buildCompare(pens), nil
}

func (s *PenService) Reviews(ctx context.Context, penID uuid.UUID) ([]model.ReviewResponse, error) {
	rows, err := s.store.ListReviewsByPen(ctx, penID)
	if err != nil {
		return nil, err
	}
	out := make([]model.ReviewResponse, 0, len(rows))
	for _, r := range rows {
		created := ""
		if r.CreatedAt.Valid {
			created = r.CreatedAt.Time.UTC().Format("2006-01-02T15:04:05Z")
		}
		out = append(out, model.ReviewResponse{
			ID:        r.ID,
			PenID:     r.PenID,
			UserName:  r.UserName,
			Rating:    r.Rating,
			Title:     r.Title,
			Body:      r.Body,
			CreatedAt: created,
		})
	}
	return out, nil
}

func (s *PenService) CreateReview(ctx context.Context, userID, penID uuid.UUID, rating int16, title *string, body string) (model.ReviewResponse, error) {
	if rating < 1 || rating > 5 || strings.TrimSpace(body) == "" {
		return model.ReviewResponse{}, ErrInvalid
	}
	row, err := s.store.CreateReview(ctx, sqlc.CreateReviewParams{
		UserID: userID,
		PenID:  penID,
		Rating: rating,
		Title:  title,
		Body:   strings.TrimSpace(body),
	})
	if err != nil {
		return model.ReviewResponse{}, ErrConflict
	}
	return model.ReviewResponse{
		ID:        row.ID,
		PenID:     row.PenID,
		Rating:    row.Rating,
		Title:     row.Title,
		Body:      row.Body,
		CreatedAt: row.CreatedAt.Time.UTC().Format("2006-01-02T15:04:05Z"),
	}, nil
}

func (s *PenService) RecentReviews(ctx context.Context, limit int32) ([]model.ReviewResponse, error) {
	rows, err := s.store.ListRecentReviews(ctx, limit)
	if err != nil {
		return nil, err
	}
	out := make([]model.ReviewResponse, 0, len(rows))
	for _, r := range rows {
		created := ""
		if r.CreatedAt.Valid {
			created = r.CreatedAt.Time.UTC().Format("2006-01-02T15:04:05Z")
		}
		title := r.PenName + " · " + r.BrandName
		out = append(out, model.ReviewResponse{
			ID:        r.ID,
			PenID:     r.PenID,
			UserName:  r.UserName,
			Rating:    r.Rating,
			Title:     &title,
			Body:      r.Body,
			CreatedAt: created,
		})
	}
	return out, nil
}

func (s *PenService) Favorites(ctx context.Context, userID uuid.UUID) ([]model.PenResponse, error) {
	rows, err := s.store.ListFavoritesByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]model.PenResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, favPen(r))
	}
	return out, nil
}

func (s *PenService) AddFavorite(ctx context.Context, userID, penID uuid.UUID) error {
	return s.store.AddFavorite(ctx, sqlc.AddFavoriteParams{UserID: userID, PenID: penID})
}

func (s *PenService) RemoveFavorite(ctx context.Context, userID, penID uuid.UUID) error {
	return s.store.RemoveFavorite(ctx, sqlc.RemoveFavoriteParams{UserID: userID, PenID: penID})
}

func (s *PenService) tags(ctx context.Context, id uuid.UUID) []string {
	rows, err := s.store.GetPenTags(ctx, id)
	if err != nil {
		return nil
	}
	out := make([]string, 0, len(rows))
	for _, t := range rows {
		out = append(out, t.Slug)
	}
	return out
}

func (s *PenService) features(ctx context.Context, id uuid.UUID) map[string]string {
	rows, err := s.store.GetPenFeatureValues(ctx, id)
	if err != nil {
		return nil
	}
	out := map[string]string{}
	for _, r := range rows {
		out[r.Key] = r.Value
	}
	return out
}

func toListParams(f PenFilter) sqlc.ListPensParams {
	return sqlc.ListPensParams{
		BrandSlug:   emptyStr(f.BrandSlug),
		Type:        emptyStr(f.Type),
		InkType:     emptyStr(f.InkType),
		TipSize:     emptyStr(f.TipSize),
		Color:       emptyStr(f.Color),
		MinPrice:    optionalNumeric(f.MinPrice),
		MaxPrice:    optionalNumeric(f.MaxPrice),
		MinWeight:   optionalNumeric(f.MinWeight),
		MaxWeight:   optionalNumeric(f.MaxWeight),
		MinRating:   f.MinRating,
		Purpose:     emptyStr(f.Purpose),
		OffsetCount: int32((f.Page - 1) * f.Limit),
		LimitCount:  int32(f.Limit),
	}
}

func toCountParams(f PenFilter) sqlc.CountPensParams {
	return sqlc.CountPensParams{
		BrandSlug: emptyStr(f.BrandSlug),
		Type:      emptyStr(f.Type),
		InkType:   emptyStr(f.InkType),
		TipSize:   emptyStr(f.TipSize),
		Color:     emptyStr(f.Color),
		MinPrice:  optionalNumeric(f.MinPrice),
		MaxPrice:  optionalNumeric(f.MaxPrice),
		MinWeight: optionalNumeric(f.MinWeight),
		MaxWeight: optionalNumeric(f.MaxWeight),
		MinRating: f.MinRating,
		Purpose:   emptyStr(f.Purpose),
	}
}

func emptyStr(s *string) *string {
	if s == nil || strings.TrimSpace(*s) == "" {
		return nil
	}
	v := strings.TrimSpace(*s)
	return &v
}

func ParseFloatQuery(s string) *float64 {
	if s == "" {
		return nil
	}
	v, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return nil
	}
	return &v
}

func ParseIntQuery(s string, fallback int) int {
	if s == "" {
		return fallback
	}
	v, err := strconv.Atoi(s)
	if err != nil {
		return fallback
	}
	return v
}

func QueryPtr(s string) *string {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	v := strings.TrimSpace(s)
	return &v
}
