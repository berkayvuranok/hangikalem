package catalog

import (
	"context"
	"net/url"
	"strings"
)

type commonsQuery struct {
	Query struct {
		Pages map[string]struct {
			Title     string `json:"title"`
			ImageInfo []struct {
				ThumbURL string `json:"thumburl"`
				URL      string `json:"url"`
			} `json:"imageinfo"`
		} `json:"pages"`
	} `json:"query"`
}

func SearchCommonsImage(ctx context.Context, query string) (string, error) {
	u := apiURL("https://commons.wikimedia.org/w/api.php", url.Values{
		"action":       {"query"},
		"format":       {"json"},
		"generator":    {"search"},
		"gsrsearch":    {query},
		"gsrnamespace": {"6"},
		"gsrlimit":     {"8"},
		"prop":         {"imageinfo"},
		"iiprop":       {"url"},
		"iiurlwidth":   {"800"},
	})
	var payload commonsQuery
	if err := getJSON(ctx, u, &payload); err != nil {
		return "", err
	}
	q := strings.ToLower(query)
	generic := map[string]bool{
		"pen": true, "pens": true, "fountain": true, "gel": true, "ink": true,
		"ballpoint": true, "mechanical": true, "pencil": true, "clip": true,
	}
	var keys []string
	for _, part := range strings.Fields(q) {
		part = strings.Trim(part, ".-")
		if len(part) < 3 || generic[part] {
			continue
		}
		keys = append(keys, part)
	}
	bestURL := ""
	bestScore := 0
	for _, p := range payload.Query.Pages {
		title := strings.ToLower(p.Title)
		if strings.Contains(title, "collage") || strings.Contains(title, "collection") || strings.Contains(title, "fun pen day") || strings.Contains(title, "zeitung") || strings.Contains(title, "newspaper") || strings.Contains(title, "giornale") || strings.Contains(title, "magazine") || strings.Contains(title, ".djvu") || strings.Contains(title, ".pdf") || strings.Contains(title, "page1") {
			continue
		}
		brandHit := false
		for _, part := range keys {
			if len(part) >= 4 && strings.Contains(title, part) && part != "fountain" && part != "ballpoint" {
				brandHit = true
				break
			}
		}
		if !brandHit {
			continue
		}
		if len(p.ImageInfo) == 0 {
			continue
		}
		info := p.ImageInfo[0]
		src := info.ThumbURL
		if src == "" {
			src = info.URL
		}
		if src == "" {
			continue
		}
		score := 0
		matchedLong := false
		for _, part := range keys {
			if strings.Contains(title, part) {
				score += 2
				if len(part) >= 4 {
					matchedLong = true
				}
			}
		}
		needLong := false
		for _, part := range keys {
			if len(part) >= 4 {
				needLong = true
				break
			}
		}
		if score == 0 || (needLong && !matchedLong) {
			continue
		}
		if score > bestScore {
			bestScore = score
			bestURL = stripTracking(src)
		}
	}
	return bestURL, nil
}

func stripTracking(raw string) string {
	u, err := url.Parse(raw)
	if err != nil {
		return raw
	}
	q := u.Query()
	q.Del("utm_source")
	q.Del("utm_campaign")
	q.Del("utm_content")
	u.RawQuery = q.Encode()
	return u.String()
}
