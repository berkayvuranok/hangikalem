package catalog

import (
	"context"
	"net/url"
	"strings"
)

type wikiSummary struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Extract     string `json:"extract"`
	Original    *struct {
		Source string `json:"source"`
	} `json:"originalimage"`
	Thumb *struct {
		Source string `json:"source"`
	} `json:"thumbnail"`
}

func WikipediaSummary(ctx context.Context, title string) (extract, image string, err error) {
	title = strings.TrimSpace(title)
	if title == "" {
		return "", "", nil
	}
	for _, host := range []string{"https://tr.wikipedia.org", "https://en.wikipedia.org"} {
		u := host + "/api/rest_v1/page/summary/" + url.PathEscape(strings.ReplaceAll(title, " ", "_"))
		var s wikiSummary
		if e := getJSON(ctx, u, &s); e != nil {
			continue
		}
		extract = strings.TrimSpace(s.Extract)
		if extract == "" {
			extract = strings.TrimSpace(s.Description)
		}
		if s.Original != nil {
			image = stripTracking(s.Original.Source)
		} else if s.Thumb != nil {
			image = stripTracking(s.Thumb.Source)
		}
		if extract != "" || image != "" {
			return extract, image, nil
		}
	}
	return "", "", nil
}
