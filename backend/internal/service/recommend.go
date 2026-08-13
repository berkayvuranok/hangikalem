package service

import (
	"context"

	"hangikalem/internal/model"
)

func (s *PenService) Recommend(ctx context.Context, req model.RecommendationRequest) ([]model.RecommendationItem, error) {
	pens, tagMap, err := s.catalogForScoring(ctx)
	if err != nil {
		return nil, err
	}
	return ScorePens(req, pens, tagMap), nil
}

func (s *PenService) Guides(ctx context.Context) ([]model.GuideItem, error) {
	pens, tagMap, err := s.catalogForScoring(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]model.GuideItem, 0, len(guidePresets))
	for _, g := range guidePresets {
		recs := ScorePens(g.req, pens, tagMap)
		if len(recs) == 0 {
			continue
		}
		alts := make([]model.PenResponse, 0, 2)
		for i, r := range recs {
			if i == 0 {
				continue
			}
			if len(alts) >= 2 {
				break
			}
			alts = append(alts, r.Pen)
		}
		reason := recs[0].Pen.BrandName + " " + recs[0].Pen.Name + " bu kategoride en dengeli seçim."
		if recs[0].Pen.WhyGood != nil && *recs[0].Pen.WhyGood != "" {
			reason = *recs[0].Pen.WhyGood
		} else if len(recs[0].Reasons) > 0 {
			reason = recs[0].Reasons[0]
		}
		out = append(out, model.GuideItem{
			Purpose:      g.purpose,
			Label:        g.label,
			Reason:       reason,
			Winner:       recs[0].Pen,
			Alternatives: alts,
		})
	}
	return out, nil
}

func (s *PenService) catalogForScoring(ctx context.Context) ([]model.PenResponse, map[string][]string, error) {
	rows, err := s.store.ListAllPensForRecommendation(ctx)
	if err != nil {
		return nil, nil, err
	}
	pens := make([]model.PenResponse, 0, len(rows))
	tagMap := map[string][]string{}
	for _, r := range rows {
		tags := s.tags(ctx, r.ID)
		p := allPen(r, tags)
		pens = append(pens, p)
		tagMap[p.Slug] = tags
	}
	return pens, tagMap, nil
}

var guidePresets = []struct {
	purpose, label string
	req            model.RecommendationRequest
}{
	{"study", "Ders", model.RecommendationRequest{
		Purpose: "study", WritingThickness: "fine", InkType: "gel", Smoothness: 7, WeightPreference: 4, Budget: 400, Priorities: []string{"value", "comfort", "long_use"},
	}},
	{"university", "Üniversite", model.RecommendationRequest{
		Purpose: "university", WritingThickness: "fine", InkType: "fountain", Smoothness: 7, WeightPreference: 5, Budget: 1400, Priorities: []string{"writing_quality", "comfort"},
	}},
	{"office", "Ofis", model.RecommendationRequest{
		Purpose: "office", WritingThickness: "medium", InkType: "ballpoint", Smoothness: 6, WeightPreference: 5, Budget: 800, Priorities: []string{"durability", "value"},
	}},
	{"drawing", "Çizim", model.RecommendationRequest{
		Purpose: "drawing", WritingThickness: "fine", InkType: "mechanical", Smoothness: 5, WeightPreference: 6, Budget: 1600, Priorities: []string{"writing_quality", "durability"},
	}},
	{"daily", "Günlük kullanım", model.RecommendationRequest{
		Purpose: "daily", WritingThickness: "fine", InkType: "gel", Smoothness: 7, WeightPreference: 3, Budget: 250, Priorities: []string{"value", "comfort"},
	}},
	{"signature", "İmza", model.RecommendationRequest{
		Purpose: "signature", WritingThickness: "medium", InkType: "fountain", Smoothness: 8, WeightPreference: 7, Budget: 5500, Priorities: []string{"premium", "design"},
	}},
	{"professional", "Profesyonel", model.RecommendationRequest{
		Purpose: "professional", WritingThickness: "fine", InkType: "fountain", Smoothness: 8, WeightPreference: 6, Budget: 5000, Priorities: []string{"writing_quality", "durability"},
	}},
}
