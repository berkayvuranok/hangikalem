package model

import "github.com/google/uuid"

type PenResponse struct {
	ID               uuid.UUID         `json:"id"`
	BrandID          uuid.UUID         `json:"brand_id"`
	BrandName        string            `json:"brand_name"`
	BrandSlug        string            `json:"brand_slug"`
	Name             string            `json:"name"`
	Slug             string            `json:"slug"`
	Description      string            `json:"description"`
	Type             string            `json:"type"`
	InkType          string            `json:"ink_type"`
	TipSize          string            `json:"tip_size"`
	Price            float64           `json:"price"`
	Weight           float64           `json:"weight"`
	Length           *float64          `json:"length,omitempty"`
	GripMaterial     *string           `json:"grip_material,omitempty"`
	BodyMaterial     *string           `json:"body_material,omitempty"`
	Color            *string           `json:"color,omitempty"`
	SmoothnessScore  float64           `json:"smoothness_score"`
	ComfortScore     float64           `json:"comfort_score"`
	DurabilityScore  float64           `json:"durability_score"`
	PrecisionScore   float64           `json:"precision_score"`
	DesignScore      float64           `json:"design_score"`
	GripScore        float64           `json:"grip_score"`
	InkQuality       float64           `json:"ink_quality"`
	ImageURL         *string           `json:"image_url,omitempty"`
	WhyGood          *string           `json:"why_good,omitempty"`
	SuitableFor      *string           `json:"suitable_for,omitempty"`
	NotSuitableFor   *string           `json:"not_suitable_for,omitempty"`
	AvgRating        float64           `json:"avg_rating"`
	ReviewCount      int               `json:"review_count"`
	Tags             []string          `json:"tags,omitempty"`
	Features         map[string]string `json:"features,omitempty"`
	ShopLinks        []ExternalLink    `json:"shop_links,omitempty"`
	ReviewLinks      []ExternalLink    `json:"review_links,omitempty"`
}

type ExternalLink struct {
	Key     string `json:"key"`
	Label   string `json:"label"`
	URL     string `json:"url"`
	Summary string `json:"summary"`
	Hint    string `json:"hint,omitempty"`
}

type BrandResponse struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Slug        string    `json:"slug"`
	LogoURL     *string   `json:"logo_url,omitempty"`
	Description *string   `json:"description,omitempty"`
}

type UserResponse struct {
	ID    uuid.UUID `json:"id"`
	Email string    `json:"email"`
	Name  string    `json:"name"`
	Role  string    `json:"role"`
}

type AdminUser struct {
	ID            uuid.UUID `json:"id"`
	Email         string    `json:"email"`
	Name          string    `json:"name"`
	Role          string    `json:"role"`
	CreatedAt     string    `json:"created_at"`
	ReviewCount   int       `json:"review_count"`
	FavoriteCount int       `json:"favorite_count"`
}

type AdminTable struct {
	Name string `json:"name"`
	Rows int    `json:"rows"`
}

type AdminTableRows struct {
	Name    string           `json:"name"`
	Columns []string         `json:"columns"`
	Items   []map[string]any `json:"items"`
	Total   int              `json:"total"`
	Limit   int              `json:"limit"`
	Offset  int              `json:"offset"`
}

type ReviewResponse struct {
	ID        uuid.UUID `json:"id"`
	PenID     uuid.UUID `json:"pen_id"`
	UserName  string    `json:"user_name"`
	Rating    int16     `json:"rating"`
	Title     *string   `json:"title,omitempty"`
	Body      string    `json:"body"`
	CreatedAt string    `json:"created_at"`
}

type RecommendationRequest struct {
	Purpose           string   `json:"purpose" binding:"required"`
	WritingThickness  string   `json:"writing_thickness" binding:"required"`
	InkType           string   `json:"ink_type" binding:"required"`
	Smoothness        int      `json:"smoothness" binding:"required,min=1,max=10"`
	WeightPreference  int      `json:"weight_preference" binding:"required,min=1,max=10"`
	Budget            float64  `json:"budget" binding:"required,min=50"`
	Priorities        []string `json:"priorities"`
}

type RecommendationItem struct {
	Pen             PenResponse `json:"pen"`
	Score           int         `json:"score"`
	Reasons         []string    `json:"reasons"`
	Strengths       []string    `json:"strengths"`
	Weaknesses      []string    `json:"weaknesses"`
	SuitableFor     []string    `json:"suitable_for"`
	NotSuitableFor  []string    `json:"not_suitable_for"`
}

type FitBreakdown struct {
	Comfort    int `json:"comfort"`
	Smoothness int `json:"smoothness"`
	Budget     int `json:"budget"`
	Weight     int `json:"weight"`
	Overall    int `json:"overall"`
}

type SearchResponse struct {
	Brands []BrandResponse `json:"brands"`
	Pens   []PenResponse   `json:"pens"`
}

type PaginatedPens struct {
	Items []PenResponse `json:"items"`
	Total int           `json:"total"`
	Page  int           `json:"page"`
	Limit int           `json:"limit"`
}

type CompareRequest struct {
	Slugs []string `json:"slugs" binding:"required,min=2,max=4"`
}

type CompareMetric struct {
	Key            string         `json:"key"`
	Label          string         `json:"label"`
	Group          string         `json:"group"`
	GroupLabel     string         `json:"group_label"`
	Values         map[string]any `json:"values"`
	BestSlug       string         `json:"best_slug"`
	HigherIsBetter bool           `json:"higher_is_better"`
}

type CompareVerdict struct {
	Key     string `json:"key"`
	Label   string `json:"label"`
	PenSlug string `json:"pen_slug"`
	PenName string `json:"pen_name"`
	Reason  string `json:"reason"`
}

type CompareResponse struct {
	Title   string           `json:"title"`
	Summary string           `json:"summary"`
	Pens    []PenResponse    `json:"pens"`
	Metrics []CompareMetric  `json:"metrics"`
	Verdict []CompareVerdict `json:"verdict"`
}

type GuideItem struct {
	Purpose      string        `json:"purpose"`
	Label        string        `json:"label"`
	Reason       string        `json:"reason"`
	Winner       PenResponse   `json:"winner"`
	Alternatives []PenResponse `json:"alternatives"`
}
