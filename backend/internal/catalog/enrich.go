package catalog

import (
	"context"
	"log"
	"sync"
)

type Enrichment struct {
	Images map[string]string
	Extras []RemotePen
}

func Load(ctx context.Context, queries map[string]string) Enrichment {
	out := Enrichment{Images: map[string]string{}}
	remote, err := FetchWikidata(ctx)
	if err != nil {
		log.Printf("wikidata: %v", err)
	} else {
		out.Extras = remote
		log.Printf("wikidata: %d model", len(remote))
	}

	type job struct{ slug, q string }
	jobs := make([]job, 0, len(queries))
	for slug, q := range queries {
		jobs = append(jobs, job{slug, q})
	}

	var mu sync.Mutex
	sem := make(chan struct{}, 5)
	var wg sync.WaitGroup
	for _, j := range jobs {
		j := j
		wg.Add(1)
		sem <- struct{}{}
		go func() {
			defer wg.Done()
			defer func() { <-sem }()
			img, err := SearchCommonsImage(ctx, j.q)
			if err != nil || img == "" {
				return
			}
			mu.Lock()
			out.Images[j.slug] = img
			mu.Unlock()
		}()
	}
	for i := range out.Extras {
		ex := &out.Extras[i]
		if ex.ImageURL != "" && ex.Description != "" {
			continue
		}
		wg.Add(1)
		sem <- struct{}{}
		go func(p *RemotePen) {
			defer wg.Done()
			defer func() { <-sem }()
			if p.ImageURL == "" {
				if img, err := SearchCommonsImage(ctx, p.Brand+" "+p.Name+" pen"); err == nil && img != "" {
					p.ImageURL = img
				}
			}
			title := p.WikiTitle
			if title == "" {
				title = p.Name
			}
			extract, img, err := WikipediaSummary(ctx, title)
			if err == nil {
				if p.Description == "" && extract != "" {
					p.Description = extract
				}
				if p.ImageURL == "" && img != "" {
					p.ImageURL = img
				}
			}
		}(ex)
	}
	wg.Wait()
	log.Printf("commons: %d görsel eşleşti", len(out.Images))
	return out
}
