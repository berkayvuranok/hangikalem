package service

import (
	"strconv"
	"time"

	"hangikalem/internal/db/sqlc"
	"hangikalem/internal/links"
	"hangikalem/internal/model"

	"github.com/jackc/pgx/v5/pgtype"
)

func ptr[T any](v T) *T { return &v }

func numericFromFloat(v float64) pgtype.Numeric {
	var n pgtype.Numeric
	_ = n.Scan(strconv.FormatFloat(v, 'f', 2, 64))
	return n
}

func optionalNumeric(v *float64) pgtype.Numeric {
	if v == nil {
		return pgtype.Numeric{}
	}
	return numericFromFloat(*v)
}

func numericToFloat(n pgtype.Numeric) *float64 {
	if !n.Valid {
		return nil
	}
	f, err := n.Float64Value()
	if err != nil || !f.Valid {
		return nil
	}
	return &f.Float64
}

func timestamptz(t time.Time) pgtype.Timestamptz {
	return pgtype.Timestamptz{Time: t, Valid: true}
}

func toPen(p sqlc.ListPensRow, tags []string, features map[string]string) model.PenResponse {
	out := model.PenResponse{
		ID:              p.ID,
		BrandID:         p.BrandID,
		BrandName:       p.BrandName,
		BrandSlug:       p.BrandSlug,
		Name:            p.Name,
		Slug:            p.Slug,
		Description:     p.Description,
		Type:            p.Type,
		InkType:         p.InkType,
		TipSize:         p.TipSize,
		Price:           p.Price,
		Weight:          p.Weight,
		Length:          numericToFloat(p.Length),
		GripMaterial:    p.GripMaterial,
		BodyMaterial:    p.BodyMaterial,
		Color:           p.Color,
		SmoothnessScore: p.SmoothnessScore,
		ComfortScore:    p.ComfortScore,
		DurabilityScore: p.DurabilityScore,
		PrecisionScore:  p.PrecisionScore,
		DesignScore:     p.DesignScore,
		GripScore:       p.GripScore,
		InkQuality:      p.InkQuality,
		ImageURL:        p.ImageUrl,
		WhyGood:         p.WhyGood,
		SuitableFor:     p.SuitableFor,
		NotSuitableFor:  p.NotSuitableFor,
		AvgRating:       p.AvgRating,
		ReviewCount:     int(p.ReviewCount),
		Tags:            tags,
		Features:        features,
	}
	out.ShopLinks = links.ShopLinks(out.BrandName, out.Name)
	out.ReviewLinks = links.ReviewLinks(out.BrandName, out.Name, out.SmoothnessScore, out.ComfortScore, out.PrecisionScore, out.DurabilityScore)
	return out
}

func slugPen(p sqlc.GetPenBySlugRow, tags []string, features map[string]string) model.PenResponse {
	return toPen(sqlc.ListPensRow{
		ID: p.ID, BrandID: p.BrandID, Name: p.Name, Slug: p.Slug, Description: p.Description,
		Type: p.Type, InkType: p.InkType, TipSize: p.TipSize, Price: p.Price, Weight: p.Weight,
		Length: p.Length, GripMaterial: p.GripMaterial, BodyMaterial: p.BodyMaterial, Color: p.Color,
		SmoothnessScore: p.SmoothnessScore, ComfortScore: p.ComfortScore, DurabilityScore: p.DurabilityScore,
		PrecisionScore: p.PrecisionScore, DesignScore: p.DesignScore, GripScore: p.GripScore, InkQuality: p.InkQuality,
		ImageUrl: p.ImageUrl, WhyGood: p.WhyGood, SuitableFor: p.SuitableFor, NotSuitableFor: p.NotSuitableFor,
		CreatedAt: p.CreatedAt, UpdatedAt: p.UpdatedAt, BrandName: p.BrandName, BrandSlug: p.BrandSlug,
		AvgRating: p.AvgRating, ReviewCount: p.ReviewCount,
	}, tags, features)
}

func idPen(p sqlc.GetPenByIDRow, tags []string, features map[string]string) model.PenResponse {
	return slugPen(sqlc.GetPenBySlugRow{
		ID: p.ID, BrandID: p.BrandID, Name: p.Name, Slug: p.Slug, Description: p.Description,
		Type: p.Type, InkType: p.InkType, TipSize: p.TipSize, Price: p.Price, Weight: p.Weight,
		Length: p.Length, GripMaterial: p.GripMaterial, BodyMaterial: p.BodyMaterial, Color: p.Color,
		SmoothnessScore: p.SmoothnessScore, ComfortScore: p.ComfortScore, DurabilityScore: p.DurabilityScore,
		PrecisionScore: p.PrecisionScore, DesignScore: p.DesignScore, GripScore: p.GripScore, InkQuality: p.InkQuality,
		ImageUrl: p.ImageUrl, WhyGood: p.WhyGood, SuitableFor: p.SuitableFor, NotSuitableFor: p.NotSuitableFor,
		CreatedAt: p.CreatedAt, UpdatedAt: p.UpdatedAt, BrandName: p.BrandName, BrandSlug: p.BrandSlug,
		AvgRating: p.AvgRating, ReviewCount: p.ReviewCount,
	}, tags, features)
}

func allPen(p sqlc.ListAllPensForRecommendationRow, tags []string) model.PenResponse {
	return toPen(sqlc.ListPensRow{
		ID: p.ID, BrandID: p.BrandID, Name: p.Name, Slug: p.Slug, Description: p.Description,
		Type: p.Type, InkType: p.InkType, TipSize: p.TipSize, Price: p.Price, Weight: p.Weight,
		Length: p.Length, GripMaterial: p.GripMaterial, BodyMaterial: p.BodyMaterial, Color: p.Color,
		SmoothnessScore: p.SmoothnessScore, ComfortScore: p.ComfortScore, DurabilityScore: p.DurabilityScore,
		PrecisionScore: p.PrecisionScore, DesignScore: p.DesignScore, GripScore: p.GripScore, InkQuality: p.InkQuality,
		ImageUrl: p.ImageUrl, WhyGood: p.WhyGood, SuitableFor: p.SuitableFor, NotSuitableFor: p.NotSuitableFor,
		CreatedAt: p.CreatedAt, UpdatedAt: p.UpdatedAt, BrandName: p.BrandName, BrandSlug: p.BrandSlug,
		AvgRating: p.AvgRating, ReviewCount: p.ReviewCount,
	}, tags, nil)
}

func popularPen(p sqlc.ListPopularPensRow) model.PenResponse {
	return toPen(sqlc.ListPensRow{
		ID: p.ID, BrandID: p.BrandID, Name: p.Name, Slug: p.Slug, Description: p.Description,
		Type: p.Type, InkType: p.InkType, TipSize: p.TipSize, Price: p.Price, Weight: p.Weight,
		Length: p.Length, GripMaterial: p.GripMaterial, BodyMaterial: p.BodyMaterial, Color: p.Color,
		SmoothnessScore: p.SmoothnessScore, ComfortScore: p.ComfortScore, DurabilityScore: p.DurabilityScore,
		PrecisionScore: p.PrecisionScore, DesignScore: p.DesignScore, GripScore: p.GripScore, InkQuality: p.InkQuality,
		ImageUrl: p.ImageUrl, WhyGood: p.WhyGood, SuitableFor: p.SuitableFor, NotSuitableFor: p.NotSuitableFor,
		CreatedAt: p.CreatedAt, UpdatedAt: p.UpdatedAt, BrandName: p.BrandName, BrandSlug: p.BrandSlug,
		AvgRating: p.AvgRating, ReviewCount: p.ReviewCount,
	}, nil, nil)
}

func searchPen(p sqlc.SearchPensRow) model.PenResponse {
	return popularPen(sqlc.ListPopularPensRow{
		ID: p.ID, BrandID: p.BrandID, Name: p.Name, Slug: p.Slug, Description: p.Description,
		Type: p.Type, InkType: p.InkType, TipSize: p.TipSize, Price: p.Price, Weight: p.Weight,
		Length: p.Length, GripMaterial: p.GripMaterial, BodyMaterial: p.BodyMaterial, Color: p.Color,
		SmoothnessScore: p.SmoothnessScore, ComfortScore: p.ComfortScore, DurabilityScore: p.DurabilityScore,
		PrecisionScore: p.PrecisionScore, DesignScore: p.DesignScore, GripScore: p.GripScore, InkQuality: p.InkQuality,
		ImageUrl: p.ImageUrl, WhyGood: p.WhyGood, SuitableFor: p.SuitableFor, NotSuitableFor: p.NotSuitableFor,
		CreatedAt: p.CreatedAt, UpdatedAt: p.UpdatedAt, BrandName: p.BrandName, BrandSlug: p.BrandSlug,
		AvgRating: p.AvgRating, ReviewCount: p.ReviewCount,
	})
}

func slugListPen(p sqlc.ListPensBySlugsRow) model.PenResponse {
	return searchPen(sqlc.SearchPensRow{
		ID: p.ID, BrandID: p.BrandID, Name: p.Name, Slug: p.Slug, Description: p.Description,
		Type: p.Type, InkType: p.InkType, TipSize: p.TipSize, Price: p.Price, Weight: p.Weight,
		Length: p.Length, GripMaterial: p.GripMaterial, BodyMaterial: p.BodyMaterial, Color: p.Color,
		SmoothnessScore: p.SmoothnessScore, ComfortScore: p.ComfortScore, DurabilityScore: p.DurabilityScore,
		PrecisionScore: p.PrecisionScore, DesignScore: p.DesignScore, GripScore: p.GripScore, InkQuality: p.InkQuality,
		ImageUrl: p.ImageUrl, WhyGood: p.WhyGood, SuitableFor: p.SuitableFor, NotSuitableFor: p.NotSuitableFor,
		CreatedAt: p.CreatedAt, UpdatedAt: p.UpdatedAt, BrandName: p.BrandName, BrandSlug: p.BrandSlug,
		AvgRating: p.AvgRating, ReviewCount: p.ReviewCount,
	})
}

func favPen(p sqlc.ListFavoritesByUserRow) model.PenResponse {
	return slugListPen(sqlc.ListPensBySlugsRow{
		ID: p.ID, BrandID: p.BrandID, Name: p.Name, Slug: p.Slug, Description: p.Description,
		Type: p.Type, InkType: p.InkType, TipSize: p.TipSize, Price: p.Price, Weight: p.Weight,
		Length: p.Length, GripMaterial: p.GripMaterial, BodyMaterial: p.BodyMaterial, Color: p.Color,
		SmoothnessScore: p.SmoothnessScore, ComfortScore: p.ComfortScore, DurabilityScore: p.DurabilityScore,
		PrecisionScore: p.PrecisionScore, DesignScore: p.DesignScore, GripScore: p.GripScore, InkQuality: p.InkQuality,
		ImageUrl: p.ImageUrl, WhyGood: p.WhyGood, SuitableFor: p.SuitableFor, NotSuitableFor: p.NotSuitableFor,
		CreatedAt: p.CreatedAt, UpdatedAt: p.UpdatedAt, BrandName: p.BrandName, BrandSlug: p.BrandSlug,
		AvgRating: p.AvgRating, ReviewCount: p.ReviewCount,
	})
}

func brandResp(b sqlc.Brand) model.BrandResponse {
	return model.BrandResponse{
		ID:          b.ID,
		Name:        b.Name,
		Slug:        b.Slug,
		LogoURL:     b.LogoUrl,
		Description: b.Description,
	}
}

func clamp(v, lo, hi float64) float64 {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}
