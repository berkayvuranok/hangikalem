package links

import (
	"net/url"
	"strings"

	"hangikalem/internal/model"
)

func query(brand, name string) string {
	return url.QueryEscape(strings.TrimSpace(brand + " " + name))
}

func ShopLinks(brand, name string) []model.ExternalLink {
	q := query(brand, name)
	return []model.ExternalLink{
		{
			Key:     "cimri",
			Label:   "Cimri",
			URL:     "https://www.cimri.com/arama?q=" + q,
			Summary: "Tüm sitelerdeki fiyatı burada karşılaştır.",
			Hint:    "Önerilen ilk durak",
		},
		{
			Key:     "trendyol",
			Label:   "Trendyol",
			URL:     "https://www.trendyol.com/sr?q=" + q,
			Summary: "Mağaza fiyatı ve Türkiye yorumları.",
			Hint:    "Mağaza",
		},
		{
			Key:     "hepsiburada",
			Label:   "Hepsiburada",
			URL:     "https://www.hepsiburada.com/ara?q=" + q,
			Summary: "Güncel mağaza fiyatına bak.",
			Hint:    "Mağaza",
		},
		{
			Key:     "amazon",
			Label:   "Amazon TR",
			URL:     "https://www.amazon.com.tr/s?k=" + q,
			Summary: "Amazon Türkiye araması.",
			Hint:    "Mağaza",
		},
	}
}

func ReviewLinks(brand, name string, smoothness, comfort, precision, durability float64) []model.ExternalLink {
	q := query(brand, name)
	pen := strings.TrimSpace(brand + " " + name)

	jet := "Kullanıcılar uç hissi, mürekkep akışı ve günlük kullanımı konuşuyor."
	if smoothness >= 8.5 {
		jet = "JetPens’te kaygan yazım ve mürekkep akışı övülüyor."
	} else if precision >= 8.8 {
		jet = "İnce hat ve kontrol üzerine yorumlar öne çıkıyor."
	}

	reddit := "Reddit’te gerçek kullanıcı deneyimleri ve uzun vadeli izlenimler var."
	if comfort >= 8.5 {
		reddit = "Uzun yazımda el yormadığı sıkça anlatılıyor."
	} else if durability >= 8.8 {
		reddit = "Dayanıklılık ve ömürlük gövde üzerine konuşuluyor."
	}

	return []model.ExternalLink{
		{
			Key:     "jetpens",
			Label:   "JetPens",
			URL:     "https://www.jetpens.com/search?q=" + q,
			Summary: jet,
			Hint:    "Uzman inceleme",
		},
		{
			Key:     "reddit",
			Label:   "Reddit",
			URL:     "https://www.reddit.com/search/?q=" + url.QueryEscape(pen+" pen"),
			Summary: reddit,
			Hint:    "Kullanıcı deneyimi",
		},
		{
			Key:     "youtube",
			Label:   "YouTube",
			URL:     "https://www.youtube.com/results?search_query=" + url.QueryEscape(pen+" pen review"),
			Summary: "Yazım testleri ve kâğıt üzerinde yakın çekimler bulunur.",
			Hint:    "Video",
		},
		{
			Key:     "trendyol",
			Label:   "Trendyol yorumları",
			URL:     "https://www.trendyol.com/sr?q=" + q,
			Summary: "Türkiye’deki alıcılar fiyat, kargo ve günlük kullanımı yazıyor.",
			Hint:    "Yerel yorum",
		},
		{
			Key:     "wikipedia",
			Label:   "Wikipedia",
			URL:     "https://tr.wikipedia.org/w/index.php?search=" + q,
			Summary: "Modelin geçmişi ve teknik kimliği burada aranır.",
			Hint:    "Ansiklopedi",
		},
	}
}
