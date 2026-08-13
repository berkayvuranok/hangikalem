package service

import (
	"math"
	"sort"
	"strings"

	"hangikalem/internal/model"
)

func buildMetrics(pens []model.PenResponse) []model.CompareMetric {
	type spec struct {
		key, label, group, groupLabel string
		get                           func(model.PenResponse) float64
		higher                        bool
	}
	metrics := make([]model.CompareMetric, 0, 14)
	metrics = append(metrics,
		stringMetric("type", "Kalem tipi", "identity", "Kim bunlar", pens, func(p model.PenResponse) string { return typeLabel(p.Type) }),
		stringMetric("tip", "Uç", "identity", "Kim bunlar", pens, func(p model.PenResponse) string { return p.TipSize }),
	)
	specs := []spec{
		{"smoothness", "Akıcılık", "writing", "Yazım", func(p model.PenResponse) float64 { return p.SmoothnessScore }, true},
		{"ink", "Mürekkep kalitesi", "writing", "Yazım", func(p model.PenResponse) float64 { return p.InkQuality }, true},
		{"precision", "Çizgi hassasiyeti", "writing", "Yazım", func(p model.PenResponse) float64 { return p.PrecisionScore }, true},
		{"weight", "Ağırlık", "feel", "Elde duruş", func(p model.PenResponse) float64 { return p.Weight }, false},
		{"comfort", "Konfor", "feel", "Elde duruş", func(p model.PenResponse) float64 { return p.ComfortScore }, true},
		{"grip", "Tutuş", "feel", "Elde duruş", func(p model.PenResponse) float64 { return p.GripScore }, true},
		{"durability", "Dayanıklılık", "quality", "Kalite", func(p model.PenResponse) float64 { return p.DurabilityScore }, true},
		{"design", "Tasarım", "quality", "Kalite", func(p model.PenResponse) float64 { return p.DesignScore }, true},
		{"rating", "Puan", "quality", "Kalite", func(p model.PenResponse) float64 { return p.AvgRating }, true},
		{"price", "Referans fiyat", "price", "Fiyat", func(p model.PenResponse) float64 { return p.Price }, false},
	}
	for _, sp := range specs {
		values := map[string]any{}
		bestSlug := pens[0].Slug
		bestVal := sp.get(pens[0])
		for _, p := range pens {
			values[p.Slug] = sp.get(p)
			v := sp.get(p)
			if sp.higher && v > bestVal {
				bestVal = v
				bestSlug = p.Slug
			}
			if !sp.higher && v < bestVal {
				bestVal = v
				bestSlug = p.Slug
			}
		}
		metrics = append(metrics, model.CompareMetric{
			Key:            sp.key,
			Label:          sp.label,
			Group:          sp.group,
			GroupLabel:     sp.groupLabel,
			Values:         values,
			BestSlug:       bestSlug,
			HigherIsBetter: sp.higher,
		})
	}
	return metrics
}

func stringMetric(key, label, group, groupLabel string, pens []model.PenResponse, get func(model.PenResponse) string) model.CompareMetric {
	values := map[string]any{}
	for _, p := range pens {
		values[p.Slug] = get(p)
	}
	return model.CompareMetric{Key: key, Label: label, Group: group, GroupLabel: groupLabel, Values: values}
}

func buildCompare(pens []model.PenResponse) model.CompareResponse {
	names := make([]string, 0, len(pens))
	bySlug := map[string]model.PenResponse{}
	for _, p := range pens {
		names = append(names, p.BrandName+" "+p.Name)
		bySlug[p.Slug] = p
	}
	metrics := buildMetrics(pens)
	penName := func(slug string) string {
		p := bySlug[slug]
		return p.BrandName + " " + p.Name
	}
	verdict := []model.CompareVerdict{}
	if cheapest := metricBest(metrics, "price"); cheapest != "" {
		p := bySlug[cheapest]
		verdict = append(verdict, model.CompareVerdict{
			Key: "cheap", Label: "En uygun referans fiyat", PenSlug: cheapest, PenName: penName(cheapest),
			Reason: formatReason(p, "katalogdaki referans fiyatı en düşük olan"),
		})
	}
	if smooth := metricBest(metrics, "smoothness"); smooth != "" {
		p := bySlug[smooth]
		verdict = append(verdict, model.CompareVerdict{
			Key: "smooth", Label: "En akıcı yazım", PenSlug: smooth, PenName: penName(smooth),
			Reason: formatReason(p, "akıcılık skorunda önde"),
		})
	}
	if comfort := metricBest(metrics, "comfort"); comfort != "" {
		p := bySlug[comfort]
		verdict = append(verdict, model.CompareVerdict{
			Key: "comfort", Label: "En konforlu tutuş", PenSlug: comfort, PenName: penName(comfort),
			Reason: formatReason(p, "uzun yazımda eli daha az yoran"),
		})
	}
	valueSlug := pens[0].Slug
	bestVal := valueScore(pens[0])
	for _, p := range pens[1:] {
		if v := valueScore(p); v > bestVal {
			bestVal = v
			valueSlug = p.Slug
		}
	}
	vp := bySlug[valueSlug]
	verdict = append(verdict, model.CompareVerdict{
		Key: "value", Label: "Fiyat/performans", PenSlug: valueSlug, PenName: penName(valueSlug),
		Reason: formatReason(vp, "skoruna göre fiyatı en mantıklı duran"),
	})
	return model.CompareResponse{
		Title:   strings.Join(names, " vs "),
		Summary: "Bu tablo seçtiğin kalemleri yazım hissi, elde duruş ve fiyat açısından yan yana koyar. Vurgulu hücre o satırdaki kazananı gösterir. Fiyatlar canlı çekilmez; Cimri’den güncel karşılaştırmaya geçebilirsin.",
		Pens:    pens,
		Metrics: metrics,
		Verdict: verdict,
	}
}

func metricBest(metrics []model.CompareMetric, key string) string {
	for _, m := range metrics {
		if m.Key == key {
			return m.BestSlug
		}
	}
	return ""
}

func valueScore(p model.PenResponse) float64 {
	if p.Price <= 0 {
		return 0
	}
	quality := (p.SmoothnessScore + p.ComfortScore + p.DurabilityScore + p.PrecisionScore + p.InkQuality) / 5
	return quality / p.Price * 1000
}

func formatReason(p model.PenResponse, clause string) string {
	return p.BrandName + " " + p.Name + ", " + clause + "."
}

func typeLabel(t string) string {
	switch t {
	case "gel":
		return "Jel"
	case "ballpoint":
		return "Tükenmez"
	case "rollerball":
		return "Rollerball"
	case "fountain":
		return "Dolma kalem"
	case "mechanical":
		return "Mekanik kalem"
	default:
		return t
	}
}

type scored struct {
	item  model.RecommendationItem
	raw   float64
}

func ScorePens(req model.RecommendationRequest, pens []model.PenResponse, tags map[string][]string) []model.RecommendationItem {
	var results []scored
	for _, p := range pens {
		if p.Price > req.Budget*1.15 {
			continue
		}
		item, raw := scoreOne(req, p, tags[p.Slug])
		results = append(results, scored{item: item, raw: raw})
	}
	sort.Slice(results, func(i, j int) bool { return results[i].raw > results[j].raw })
	out := make([]model.RecommendationItem, 0, 6)
	for i, r := range results {
		if i >= 6 {
			break
		}
		out = append(out, r.item)
	}
	return out
}

func scoreOne(req model.RecommendationRequest, p model.PenResponse, tags []string) (model.RecommendationItem, float64) {
	w := map[string]float64{
		"ink": 1.3, "purpose": 1.1, "thickness": 1.15, "smooth": 1.0,
		"weight": 0.9, "budget": 1.2, "comfort": 0.85, "durability": 0.55,
		"design": 0.45, "precision": 0.7, "grip": 0.6,
	}
	for _, pr := range req.Priorities {
		switch pr {
		case "comfort":
			w["comfort"] *= 1.4
			w["grip"] *= 1.3
		case "writing_quality":
			w["smooth"] *= 1.4
			w["precision"] *= 1.35
		case "design":
			w["design"] *= 1.5
		case "durability":
			w["durability"] *= 1.5
		case "value":
			w["budget"] *= 1.4
		case "premium":
			w["design"] *= 1.35
		case "long_use":
			w["comfort"] *= 1.35
			w["durability"] *= 1.3
			w["grip"] *= 1.25
		}
	}

	ink := 40.0
	if strings.EqualFold(p.InkType, req.InkType) || strings.EqualFold(p.Type, req.InkType) {
		ink = 100
	}
	purpose := 55.0
	if hasTag(tags, req.Purpose) {
		purpose = 100
	}
	thick := thicknessScore(req.WritingThickness, p.TipSize)
	smooth := 100 - math.Abs(float64(req.Smoothness)-p.SmoothnessScore)*10
	prefW := 8 + float64(req.WeightPreference-1)*2.4
	weight := 100 - math.Min(70, math.Abs(prefW-p.Weight)*5)
	budget := 100.0
	if p.Price <= req.Budget {
		budget = 100 - ((req.Budget-p.Price)/req.Budget)*18
	} else {
		budget = 50 - ((p.Price-req.Budget)/req.Budget)*80
	}
	comfort := p.ComfortScore * 10
	durability := p.DurabilityScore * 10
	design := p.DesignScore * 10
	precision := p.PrecisionScore * 10
	grip := p.GripScore * 10

	parts := map[string]float64{
		"ink": ink, "purpose": purpose, "thickness": thick, "smooth": clamp(smooth, 0, 100),
		"weight": clamp(weight, 0, 100), "budget": clamp(budget, 0, 100), "comfort": clamp(comfort, 0, 100),
		"durability": clamp(durability, 0, 100), "design": clamp(design, 0, 100), "precision": clamp(precision, 0, 100),
		"grip": clamp(grip, 0, 100),
	}
	var sumW, sum float64
	for k, v := range parts {
		sum += v * w[k]
		sumW += w[k]
	}
	raw := sum / sumW
	score := int(math.Round(clamp(raw, 35, 98)))

	item := model.RecommendationItem{
		Pen:            p,
		Score:          score,
		Reasons:        reasons(req, p, parts),
		Strengths:      strengths(p),
		Weaknesses:     weaknesses(p),
		SuitableFor:    splitText(p.SuitableFor),
		NotSuitableFor: splitText(p.NotSuitableFor),
	}
	return item, raw
}

func FitScore(req model.RecommendationRequest, p model.PenResponse) model.FitBreakdown {
	smooth := int(clamp(100-math.Abs(float64(req.Smoothness)-p.SmoothnessScore)*10, 0, 100))
	prefW := 8 + float64(req.WeightPreference-1)*2.4
	weight := int(clamp(100-math.Min(70, math.Abs(prefW-p.Weight)*5), 0, 100))
	budget := 100
	if p.Price > req.Budget {
		budget = int(clamp(50-((p.Price-req.Budget)/req.Budget)*80, 0, 100))
	}
	comfort := int(clamp(p.ComfortScore*10, 0, 100))
	overall := int(math.Round(float64(comfort+smooth+budget+weight) / 4))
	return model.FitBreakdown{Comfort: comfort, Smoothness: smooth, Budget: budget, Weight: weight, Overall: overall}
}

func hasTag(tags []string, slug string) bool {
	for _, t := range tags {
		if t == slug {
			return true
		}
	}
	return false
}

func thicknessScore(pref, tip string) float64 {
	groups := map[string][]string{
		"extra_fine": {"0.28mm", "0.3mm", "0.38mm", "EF"},
		"fine":       {"0.4mm", "0.5mm", "F"},
		"medium":     {"0.7mm", "M"},
		"bold":       {"1.0mm", "1.2mm", "1.4mm", "B"},
	}
	for _, t := range groups[pref] {
		if strings.EqualFold(t, tip) {
			return 100
		}
	}
	neighbors := map[string][]string{
		"extra_fine": {"fine"},
		"fine":       {"extra_fine", "medium"},
		"medium":     {"fine", "bold"},
		"bold":       {"medium"},
	}
	for _, n := range neighbors[pref] {
		for _, t := range groups[n] {
			if strings.EqualFold(t, tip) {
				return 72
			}
		}
	}
	return 42
}

func reasons(req model.RecommendationRequest, p model.PenResponse, parts map[string]float64) []string {
	var out []string
	if parts["comfort"] >= 82 {
		out = append(out, "Uzun süreli yazım için oldukça rahat")
	}
	if parts["smooth"] >= 80 && req.Smoothness >= 6 {
		out = append(out, "Kaygan ve akıcı bir yazım hissi sunuyor")
	}
	if parts["smooth"] >= 75 && req.Smoothness <= 5 {
		out = append(out, "İnce ve kontrollü yazım sunuyor")
	}
	if parts["thickness"] >= 90 {
		out = append(out, "Tercih ettiğiniz uç kalınlığıyla uyumlu")
	}
	if parts["budget"] >= 80 {
		out = append(out, "Bütçenize uygun")
	}
	if parts["ink"] >= 90 {
		out = append(out, "Seçtiğiniz mürekkep tipi ile birebir eşleşiyor")
	}
	if p.PrecisionScore >= 8.8 {
		out = append(out, "Çizgi hassasiyeti yüksek")
	}
	if len(out) == 0 {
		out = append(out, "Genel tercihlerinizle dengeli bir uyum gösteriyor")
	}
	if len(out) > 4 {
		out = out[:4]
	}
	return out
}

func strengths(p model.PenResponse) []string {
	var s []string
	if p.ComfortScore >= 8.5 {
		s = append(s, "Uzun yazım seanslarında eli yormaz")
	}
	if p.SmoothnessScore >= 8.6 {
		s = append(s, "Yüksek yazım akıcılığı")
	}
	if p.DurabilityScore >= 8.5 {
		s = append(s, "Dayanıklı gövde ve mekanizma")
	}
	if p.DesignScore >= 8.7 {
		s = append(s, "Premium ve özenli tasarım")
	}
	if p.PrecisionScore >= 8.6 {
		s = append(s, "Net ve kontrollü çizgi")
	}
	if p.Price < 150 {
		s = append(s, "Güçlü fiyat/performans")
	}
	if len(s) == 0 {
		s = append(s, "Dengeli ve güvenilir günlük kullanım")
	}
	return s
}

func weaknesses(p model.PenResponse) []string {
	var s []string
	if p.Weight >= 22 {
		s = append(s, "Bazı kullanıcılar için biraz ağır gelebilir")
	}
	if p.Price >= 1500 {
		s = append(s, "Giriş seviyesi bütçenin üzerinde")
	}
	if p.SmoothnessScore <= 7.2 {
		s = append(s, "Çok kaygan bir yazım hissi arayanlara göre daha kontrollü")
	}
	if p.ComfortScore <= 7.4 {
		s = append(s, "Çok uzun notlarda tutuş yorucu olabilir")
	}
	if p.Type == "fountain" {
		s = append(s, "Bakım ve mürekkep alışkanlığı ister")
	}
	if len(s) == 0 {
		s = append(s, "Belirgin bir zayıf yönü yok; tercih meselesi")
	}
	if len(s) > 3 {
		s = s[:3]
	}
	return s
}

func splitText(v *string) []string {
	if v == nil || strings.TrimSpace(*v) == "" {
		return nil
	}
	parts := strings.Split(*v, "|")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}
