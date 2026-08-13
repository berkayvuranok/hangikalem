package catalog

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const userAgent = "HangiKalem/1.0 (https://github.com/berkayvuranok/hangikalem; catalog-sync)"

var httpClient = &http.Client{Timeout: 18 * time.Second}

func getJSON(ctx context.Context, rawURL string, dest any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Accept", "application/json")
	res, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode >= 400 {
		b, _ := io.ReadAll(io.LimitReader(res.Body, 512))
		return fmt.Errorf("%s: %s", res.Status, strings.TrimSpace(string(b)))
	}
	return json.NewDecoder(res.Body).Decode(dest)
}

func apiURL(base string, params url.Values) string {
	u, _ := url.Parse(base)
	u.RawQuery = params.Encode()
	return u.String()
}

func Slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	repl := strings.NewReplacer(
		"'", "", "’", "", ".", "", ",", "", "/", "-",
		" ", "-", "ü", "u", "ö", "o", "ş", "s", "ı", "i", "ğ", "g", "ç", "c",
		"ä", "a", "é", "e", "&", "and",
	)
	s = repl.Replace(s)
	var b strings.Builder
	prevDash := false
	for _, r := range s {
		ok := (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-'
		if !ok {
			continue
		}
		if r == '-' {
			if prevDash {
				continue
			}
			prevDash = true
		} else {
			prevDash = false
		}
		b.WriteRune(r)
	}
	return strings.Trim(b.String(), "-")
}
