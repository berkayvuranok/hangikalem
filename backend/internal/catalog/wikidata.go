package catalog

import (
	"context"
	"net/url"
	"strings"
)

type RemotePen struct {
	Brand       string
	Name        string
	Slug        string
	Description string
	Type        string
	ImageURL    string
	WikiTitle   string
	Source      string
}

type sparqlResponse struct {
	Results struct {
		Bindings []map[string]struct {
			Value string `json:"value"`
		} `json:"bindings"`
	} `json:"results"`
}

const sparqlQuery = `
SELECT DISTINCT ?item ?itemLabel ?itemDescription ?typeLabel ?makerLabel ?image ?enwiki WHERE {
  {
    VALUES ?type { wd:Q192401 wd:Q160137 wd:Q192132 wd:Q1499793 wd:Q1326301 }
    ?item wdt:P31 ?type .
  } UNION {
    VALUES ?maker { wd:Q637707 wd:Q1356034 wd:Q546004 }
    ?item wdt:P176 ?maker .
  }
  OPTIONAL { ?item wdt:P176 ?maker . }
  OPTIONAL { ?item wdt:P31 ?type . }
  OPTIONAL { ?item wdt:P18 ?image . }
  OPTIONAL {
    ?en schema:about ?item ;
        schema:isPartOf <https://en.wikipedia.org/> ;
        schema:name ?enwiki .
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "tr,en". }
}
LIMIT 80
`

func FetchWikidata(ctx context.Context) ([]RemotePen, error) {
	u := apiURL("https://query.wikidata.org/sparql", url.Values{
		"format": {"json"},
		"query":  {sparqlQuery},
	})
	var payload sparqlResponse
	if err := getJSON(ctx, u, &payload); err != nil {
		return nil, err
	}
	seen := map[string]bool{}
	var out []RemotePen
	for _, b := range payload.Results.Bindings {
		name := b["itemLabel"].Value
		if name == "" || strings.HasPrefix(name, "Q") || len(name) < 3 {
			continue
		}
		low := strings.ToLower(name)
		if low == "pen" || low == "fountain pen" || low == "ballpoint pen" || strings.Contains(low, "trademark") {
			continue
		}
		maker := b["makerLabel"].Value
		if maker == "" {
			maker = inferBrand(name)
		}
		if maker == "" {
			continue
		}
		typ := mapWikidataType(b["typeLabel"].Value, name)
		slug := Slugify(maker + "-" + name)
		if seen[slug] {
			continue
		}
		seen[slug] = true
		img := b["image"].Value
		if img != "" {
			img = strings.Replace(img, "http://", "https://", 1)
			if !strings.Contains(img, "width=") {
				img += "?width=800"
			}
		}
		out = append(out, RemotePen{
			Brand:       maker,
			Name:        name,
			Slug:        slug,
			Description: b["itemDescription"].Value,
			Type:        typ,
			ImageURL:    img,
			WikiTitle:   b["enwiki"].Value,
			Source:      "wikidata",
		})
	}
	return out, nil
}

func inferBrand(name string) string {
	brands := []string{"Pilot", "Lamy", "Parker", "Montblanc", "BIC", "Sailor", "Kaweco", "rOtring", "Rotring", "Pentel", "Zebra", "Uni", "Tombow", "Cross", "Staedtler", "Muji", "Monami", "Fisher", "Caran"}
	for _, b := range brands {
		if strings.Contains(strings.ToLower(name), strings.ToLower(b)) {
			return b
		}
	}
	return ""
}

func mapWikidataType(label, name string) string {
	s := strings.ToLower(label + " " + name)
	switch {
	case strings.Contains(s, "fountain") || strings.Contains(s, "dolma"):
		return "fountain"
	case strings.Contains(s, "gel") || strings.Contains(s, "frixion") || strings.Contains(s, "hi-tec"):
		return "gel"
	case strings.Contains(s, "mechanical") || strings.Contains(s, "pencil") || strings.Contains(s, "mekanik"):
		return "mechanical"
	case strings.Contains(s, "roller"):
		return "rollerball"
	default:
		return "ballpoint"
	}
}
