package seed

import (
	"context"
	"fmt"
	"strings"

	"hangikalem/internal/catalog"
	"hangikalem/internal/db/sqlc"
	"hangikalem/internal/repository"
	"hangikalem/internal/utils"

	"github.com/jackc/pgx/v5/pgtype"
)

func str(s string) *string { return &s }

func num(v float64) pgtype.Numeric {
	var n pgtype.Numeric
	_ = n.Scan(fmt.Sprintf("%.1f", v))
	return n
}

type penDef struct {
	Brand, Name, Slug, Desc, Type, Ink, Tip string
	Price, Weight, Length                   float64
	Grip, Body, Color, Hex                  string
	Smooth, Comfort, Dura, Prec, Design, GripS, InkQ float64
	Why, Suitable, NotSuitable              string
	Tags                                    []string
	Category                                string
}

func Run(ctx context.Context, store *repository.Store) error {
	brands := []struct{ name, slug, desc string }{
		{"Uni-ball", "uni", "Japon hassasiyeti ve Jetstream akıcılığı."},
		{"Pilot", "pilot", "Gel, dolma kalem ve mekanik kalemde referans marka."},
		{"Lamy", "lamy", "Bauhaus çizgisinde Alman tasarımı."},
		{"Pentel", "pentel", "EnerGel ve teknik çizim kalemlerinin evi."},
		{"Zebra", "zebra", "Sarasa ve çelik gövdeli ofis efsaneleri."},
		{"Parker", "parker", "Klasik imza kalemleri."},
		{"Kaweco", "kaweco", "Cep boyu Alman dolma kalem geleneği."},
		{"rOtring", "rotring", "Mühendislik hassasiyeti."},
		{"Tombow", "tombow", "Japon kırtasiye ve yazım konforu."},
		{"Faber-Castell", "faber-castell", "İki asırlık yazım ve çizim geleneği."},
		{"Sailor", "sailor", "Japon dolma kalem zanaatı."},
		{"Caran d'Ache", "caran-dache", "İsviçre lüksü ve 849 ikonu."},
		{"Staedtler", "staedtler", "Teknik kalem ve çizim."},
		{"Muji", "muji", "Sade, işlevsel, günlük."},
		{"Cross", "cross", "Amerikan imza geleneği."},
		{"BIC", "bic", "Herkesin tanıdığı, her yerde bulunan tükenmez."},
		{"Platinum", "platinum", "Preppy’den 3776’ya Japon dolma kalem."},
		{"TWSBI", "twsbi", "Şeffaf piston doldurmalı dolma kalemler."},
		{"Pelikan", "pelikan", "Alman mürekkep ve dolma kalem geleneği."},
		{"Waterman", "waterman", "Fransız imza kalemleri."},
		{"Montblanc", "montblanc", "Lüks yazımın ikonu."},
		{"Sakura", "sakura", "Gelly Roll ve pigment mürekkep."},
		{"Paper Mate", "paper-mate", "Amerikan okul ve ofis jeli."},
		{"Schneider", "schneider", "Alman ofis yazımı, Slider serisi."},
		{"Ohto", "ohto", "Japon iğne uç ve alüminyum gövde."},
		{"Serve", "serve", "Türkiye’de her kırtasiyede bulunan günlük kalem."},
		{"Adel", "adel", "Türk okul kalemi klasiği."},
		{"Diplomat", "diplomat", "Alman dolma kalem, Aero ve Magnum."},
		{"Fisher", "fisher", "Uzayda yazan basınçlı tükenmez."},
		{"Jinhao", "jinhao", "Uygun fiyatlı Çin dolma kalemleri."},
		{"Hongdian", "hongdian", "Bütçe dolma kalemde orman ve pirinç."},
		{"Sheaffer", "sheaffer", "Amerikan imza kalemi geleneği."},
		{"Leuchtturm", "leuchtturm", "Drehgriffel ve defter dünyası."},
		{"Sharpie", "sharpie", "Jel ve keçeli yazım."},
		{"Stabilo", "stabilo", "Worker ve bionic ofis kalemleri."},
		{"Monami", "monami", "Kore’nin 153 klasiği."},
		{"Faber-Castell Graf", "graf-von-faber", "Faber-Castell’in lüks hattı."},
	}
	brandIDs := map[string]sqlc.Brand{}
	for _, b := range brands {
		row, err := store.InsertBrand(ctx, sqlc.InsertBrandParams{Name: b.name, Slug: b.slug, Description: str(b.desc)})
		if err != nil {
			return err
		}
		brandIDs[b.slug] = row
	}

	cats := []struct{ name, slug string }{
		{"Tükenmez", "ballpoint"},
		{"Jel", "gel"},
		{"Rollerball", "rollerball"},
		{"Dolma kalem", "fountain"},
		{"Mekanik kalem", "mechanical"},
	}
	catIDs := map[string]sqlc.Category{}
	for _, c := range cats {
		row, err := store.InsertCategory(ctx, sqlc.InsertCategoryParams{Name: c.name, Slug: c.slug})
		if err != nil {
			return err
		}
		catIDs[c.slug] = row
	}

	tagList := []struct{ name, slug string }{
		{"Ders", "study"}, {"Üniversite", "university"}, {"Ofis", "office"},
		{"Çizim", "drawing"}, {"Günlük", "daily"}, {"İmza", "signature"}, {"Profesyonel", "professional"},
	}
	tagIDs := map[string]sqlc.Tag{}
	for _, t := range tagList {
		row, err := store.InsertTag(ctx, sqlc.InsertTagParams{Name: t.name, Slug: t.slug})
		if err != nil {
			return err
		}
		tagIDs[t.slug] = row
	}

	features := []struct{ key, label string }{
		{"refill", "Yedek uç"}, {"retractable", "Mekanizma"}, {"clip", "Klips"},
	}
	featIDs := map[string]sqlc.PenFeature{}
	for _, f := range features {
		row, err := store.InsertFeature(ctx, sqlc.InsertFeatureParams{Key: f.key, Label: f.label})
		if err != nil {
			return err
		}
		featIDs[f.key] = row
	}

	pens := []penDef{
		{"uni", "Jetstream 0.5", "uni-jetstream", "Yağ bazlı mürekkebin kayganlığıyla tükenmez kalemin kuruluğunu birleştiren efsane. Uzun notlarda leke bırakmaz, eli yormaz.", "ballpoint", "ballpoint", "0.5mm", 249, 11.5, 148, "kauçuk", "plastik", "siyah", "#1E3A5F", 9.2, 8.9, 8.6, 8.8, 7.8, 8.7, 9.0, "Hızlı kuruyan, kaygan ve lekesiz yazım.", "Ders|Ofis|Günlük not", "Çok kalın hat sevenler", []string{"study", "university", "office", "daily"}, "ballpoint"},
		{"pilot", "G2 0.5", "pilot-g2", "Dünyanın en çok satan jel kalemlerinden. Yumuşak grip ve parlak siyah hat.", "gel", "gel", "0.5mm", 89, 12.2, 147, "kauçuk", "plastik", "siyah", "#111111", 8.8, 8.6, 7.4, 8.2, 7.2, 8.8, 8.5, "Erişilebilir fiyatla konforlu jel yazım.", "Ders|Günlük kullanım", "Premium his arayanlar", []string{"study", "daily", "university"}, "gel"},
		{"pilot", "Kakuno", "pilot-kakuno", "İlk dolma kalem deneyimi için tasarlandı. Smile nib ve güvenli kapak.", "fountain", "fountain", "F", 450, 11.0, 131, "plastik", "plastik", "mavi", "#3B6FA0", 8.4, 8.5, 7.8, 8.0, 8.1, 7.6, 8.3, "Başlangıç dolma kaleminde en sevimli ve güvenilir seçenek.", "Öğrenciler|İlk dolma kalem", "Ağır metal gövde isteyenler", []string{"study", "university", "daily"}, "fountain"},
		{"pilot", "Vanishing Point", "pilot-vanishing-point", "Tıklamalı dolma kalem. Kapak yok, anında yazım. Pirinç gövde, 18k uç.", "fountain", "fountain", "F", 4200, 30.0, 140, "metal", "pirinç", "siyah", "#1A1A1A", 9.0, 7.6, 9.2, 9.1, 9.4, 7.4, 9.3, "Kapaksız, tıklamalı dolma kalem deneyimi.", "Profesyonel|Ofis|İmza", "Hafif kalem arayanlar|Küçük el", []string{"professional", "office", "signature"}, "fountain"},
		{"lamy", "Safari", "lamy-safari", "İkonik grip çukurları ve üçlü kapak. Okuldan ofise her yerde.", "fountain", "fountain", "M", 890, 16.5, 140, "plastik", "ABS", "terracotta", "#C45C26", 8.2, 8.8, 9.0, 8.3, 8.9, 9.2, 8.4, "Tutuşu öğreten, neredeyse indestructible bir tasarım.", "Ders|Üniversite|Günlük", "Cepte taşımak isteyenler (kapak tıklaması)", []string{"study", "university", "daily"}, "fountain"},
		{"lamy", "2000", "lamy-2000", "Makrolon + paslanmaz çelik. Piston doldurma, 14k altın uç, Bauhaus sade.", "fountain", "fountain", "F", 3800, 25.0, 140, "makrolon", "makrolon", "siyah", "#2C2C2C", 9.4, 8.7, 9.5, 9.3, 9.7, 8.4, 9.5, "Modern dolma kalemin zirvesi.", "Profesyonel|İmza", "Başlangıç bütçesi", []string{"professional", "signature", "office"}, "fountain"},
		{"pentel", "EnerGel 0.5", "pentel-energel", "Hızlı kuruyan jel. Solak yazanların favorisi. Canlı, net hat.", "gel", "gel", "0.5mm", 95, 12.0, 146, "kauçuk", "plastik", "siyah", "#0F766E", 9.0, 8.5, 7.6, 8.6, 7.4, 8.6, 8.8, "Lekesiz, hızlı kuruyan jel.", "Ders|Ofis|Solak yazanlar", "Kalın hat sevenler", []string{"study", "office", "university"}, "gel"},
		{"zebra", "Sarasa Clip 0.5", "zebra-sarasa", "Güçlü klips, canlı renkler, yumuşak jel. Defter kapağına takılır.", "gel", "gel", "0.5mm", 45, 11.0, 141, "kauçuk", "plastik", "mavi", "#1D4ED8", 8.7, 8.3, 7.2, 8.1, 7.6, 8.2, 8.4, "Ucuz, neşeli ve şaşırtıcı derecede akıcı.", "Günlük|Ders|Renkli not", "Ağır premium his", []string{"daily", "study"}, "gel"},
		{"parker", "Jotter", "parker-jotter", "1954'ten beri ikon. Tıklama sesi, paslanmaz çelik, imza kalemi.", "ballpoint", "ballpoint", "M", 650, 16.0, 128, "metal", "çelik", "gümüş", "#C0C7D0", 7.8, 7.9, 9.1, 7.6, 8.8, 7.8, 7.9, "Klasik tıklamalı imza kalemi.", "Ofis|İmza|Günlük", "İnce uç takıntısı", []string{"office", "signature", "daily"}, "ballpoint"},
		{"kaweco", "Sport Classic", "kaweco-sport", "Cep boyu sekizgen gövde. Kapak takılınca tam boy. 1930'lardan gelen form.", "fountain", "fountain", "F", 720, 10.5, 105, "plastik", "plastik", "yeşil", "#3F6B4B", 8.3, 7.8, 8.2, 8.2, 9.0, 7.2, 8.4, "Cebinizde duran, açınca büyüyen bir klasik.", "Günlük|Seyahat|Üniversite", "Uzun kesintisiz yazım (küçük gövde)", []string{"daily", "university", "professional"}, "fountain"},
		{"rotring", "600 0.5", "rotring-600", "Altıgen pirinç gövde, sabit uç. Teknik çizimin kralı. Ağır, hassas, ciddi.", "mechanical", "mechanical", "0.5mm", 1450, 24.0, 141, "knurled", "pirinç", "siyah", "#8B1E1E", 7.6, 7.4, 9.6, 9.5, 9.2, 8.0, 8.0, "Mühendislik masasının vazgeçilmezi.", "Çizim|Profesyonel|Üniversite", "Hafif kalem|Uzun deneme yazımı", []string{"drawing", "professional", "university"}, "mechanical"},
		{"tombow", "Mono Graph 0.5", "tombow-mono-graph", "Çevirmeli silgi, sarsıntısız uç. Japon okul klasiği.", "mechanical", "mechanical", "0.5mm", 180, 16.0, 148, "plastik", "plastik", "siyah", "#222222", 7.8, 8.2, 8.0, 8.7, 7.9, 8.1, 7.8, "Sarsıntısız uç ve kocaman silgi.", "Ders|Çizim|Üniversite", "Metal gövde isteyenler", []string{"study", "drawing", "university"}, "mechanical"},
		{"faber-castell", "Grip 2011", "faber-grip-2011", "Üçgen gövde, noktalı grip. El yormadan saatlerce yazılır.", "mechanical", "mechanical", "0.7mm", 220, 18.0, 140, "noktalı", "plastik", "gümüş", "#A8B2BC", 7.9, 9.1, 8.3, 8.0, 8.0, 9.3, 7.7, "Üçgen tutuşla konforun tanımı.", "Ders|Uzun yazım|Üniversite", "Çok ince uç", []string{"study", "university", "daily"}, "mechanical"},
		{"sailor", "1911 Standard", "sailor-1911", "Altın uç, geri besleme, ıslak ve net hat. Japon zanaatının imzası.", "fountain", "fountain", "M", 4500, 20.5, 140, "reçine", "reçine", "siyah", "#0B1320", 9.5, 8.6, 9.0, 9.4, 9.3, 8.2, 9.6, "Islak, müzikal bir uç karakteri.", "Profesyonel|İmza", "Bütçe|Bakım istemeyenler", []string{"professional", "signature"}, "fountain"},
		{"caran-dache", "849", "caran-849", "Hexagonal alüminyum, Swiss Made. Cepte duran bir mücevher.", "ballpoint", "ballpoint", "M", 1100, 18.0, 128, "alüminyum", "alüminyum", "altın", "#C4A574", 8.0, 8.0, 9.3, 7.8, 9.5, 8.1, 8.0, "Tasarım objesi kadar yazım aracı.", "Ofis|İmza|Hediye", "Jel akıcılığı arayanlar", []string{"office", "signature", "professional"}, "ballpoint"},
		{"staedtler", "925 25", "staedtler-925", "Alüminyum teknik kalem. Denge, tıklama, çizim masası.", "mechanical", "mechanical", "0.5mm", 380, 16.5, 143, "knurled", "alüminyum", "gümüş", "#7A8490", 7.7, 8.0, 8.8, 9.2, 8.3, 8.3, 7.9, "Teknik çizimde fiyat/performans yıldızı.", "Çizim|Üniversite|Mühendislik", "Yumuşak yazım hissi", []string{"drawing", "university", "professional"}, "mechanical"},
		{"muji", "Gel Ink 0.5", "muji-gel", "Kutunun dışında hiçbir şey. Şeffaf gövde, düzgün jel, Muji sakinliği.", "gel", "gel", "0.5mm", 35, 9.5, 150, "plastik", "plastik", "şeffaf", "#D6D3CD", 8.4, 8.0, 6.8, 8.0, 8.6, 7.5, 8.2, "Sade, hafif, dikkat dağıtmayan yazım.", "Günlük|Ders|Minimalist", "Dayanıklı metal gövde", []string{"daily", "study"}, "gel"},
		{"cross", "Century II", "cross-century-ii", "İnce silindir, parlak lake, ağır imza hissi. Amerikan ofis klasiği.", "ballpoint", "ballpoint", "M", 2100, 26.0, 137, "lake", "pirinç", "siyah", "#1C1917", 7.7, 7.2, 9.0, 7.5, 8.9, 7.0, 7.8, "İmza töreninin kalemi.", "İmza|Profesyonel", "Uzun not|Hafif tutuş", []string{"signature", "professional", "office"}, "ballpoint"},
		{"uni", "Signo 307 0.5", "uni-signo-307", "Pigment jel, suya ve ışığa dayanıklı. Arşiv kalitesi günlük kalem.", "gel", "gel", "0.5mm", 70, 11.2, 145, "kauçuk", "plastik", "siyah", "#172554", 8.6, 8.4, 8.0, 8.5, 7.3, 8.4, 8.9, "Arşivlenebilir, net siyah hat.", "Ders|Ofis|Belge", "Kalın imza hattı", []string{"study", "office", "daily"}, "gel"},
		{"pilot", "Metropolitan", "pilot-metropolitan", "Metal gövde, kartuş/converter, şaşırtıcı fiyat. Ciddi ilk dolma kalem.", "fountain", "fountain", "M", 980, 24.5, 137, "metal", "pirinç", "siyah", "#2A2A2A", 8.5, 7.8, 8.7, 8.4, 8.2, 7.5, 8.5, "Metal gövdeli, uygun fiyatlı dolma kalem.", "Üniversite|Günlük|Başlangıç", "Hafif kalem", []string{"university", "daily", "professional"}, "fountain"},
		{"pentel", "GraphGear 1000", "pentel-graphgear-1000", "Geri çekilebilir uç, metal tutuş, denge. Çizim ve not bir arada.", "mechanical", "mechanical", "0.5mm", 540, 20.0, 148, "knurled", "metal", "gümüş", "#94A3B8", 7.8, 8.3, 8.9, 9.3, 8.5, 8.6, 7.9, "Ucu içeri alınan teknik kalem.", "Çizim|Üniversite|Cep", "Çok hafif tutuş", []string{"drawing", "university", "professional"}, "mechanical"},
		{"zebra", "F-701", "zebra-f701", "Paslanmaz çelik tükenmez. Ağır, tıklamalı, neredeyse ömürlük.", "ballpoint", "ballpoint", "0.7mm", 160, 21.0, 132, "çelik", "çelik", "gümüş", "#B8BFC7", 7.5, 7.6, 9.7, 7.8, 8.4, 7.7, 7.6, "Cebinizde bir tank.", "Ofis|Günlük|Saha", "Jel kayganlığı", []string{"office", "daily", "professional"}, "ballpoint"},
		{"lamy", "AL-Star", "lamy-al-star", "Safari'nin alüminyum kardeşi. Şeffaf grip, daha ağır, daha ciddi.", "fountain", "fountain", "F", 1050, 22.0, 140, "plastik", "alüminyum", "grafit", "#6B7280", 8.3, 8.6, 8.8, 8.4, 8.7, 9.0, 8.4, "Alüminyum Safari: aynı tutuş, daha fazla ağırlık.", "Üniversite|Ofis|Günlük", "Cep boyu", []string{"university", "office", "daily"}, "fountain"},
		{"pilot", "Hi-Tec-C 0.4", "pilot-hi-tec-c", "İğne uç, ultra ince hat. Japon not takıntısının kalemi.", "gel", "gel", "0.4mm", 85, 9.8, 136, "plastik", "plastik", "siyah", "#0F172A", 8.1, 7.9, 7.0, 9.6, 7.5, 7.4, 8.7, "Kâğıtta cerrahi bir çizgi.", "Ders|İnce yazım|Teknik not", "Kalın hat|Ağır gövde", []string{"study", "university", "drawing"}, "gel"},
	}
	pens = append(pens, extraPens()...)
	pens = append(pens, morePens()...)
	pens = append(pens, evenMorePens()...)

	pens = applyCatalog(ctx, pens)

	hash, err := utils.HashPassword("password123")
	if err != nil {
		return err
	}
	users := []sqlc.InsertUserIfMissingParams{
		{Email: "admin@hangikalem.com", PasswordHash: hash, Name: "Yönetici", Role: "admin"},
		{Email: "ayse@example.com", PasswordHash: hash, Name: "Ayşe Kaya", Role: "user"},
		{Email: "mert@example.com", PasswordHash: hash, Name: "Mert Demir", Role: "user"},
		{Email: "elif@example.com", PasswordHash: hash, Name: "Elif Şahin", Role: "user"},
	}
	var seededUsers []sqlc.User
	for _, u := range users {
		row, err := store.InsertUserIfMissing(ctx, u)
		if err != nil {
			return err
		}
		seededUsers = append(seededUsers, row)
	}

	reviewPool := []struct {
		rating int16
		title  string
		body   string
	}{
		{5, "Günlük vazgeçilmezim", "Saatlerce yazmama rağmen elim yorulmadı. Akıcılık tam istediğim gibi."},
		{4, "Beklentimin üzerinde", "Fiyatına göre yazım kalitesi çok iyi. Tek eksiği biraz daha ağır olabilirdi."},
		{5, "İmza kalemim oldu", "Kâğıtta bıraktığı his premium. Hediye olarak da aldım, herkes beğendi."},
		{4, "Dersler için ideal", "İnce uç notlarımı toparlamamı sağladı. Defterde taşma yok."},
	}

	for i, p := range pens {
		brand, ok := brandIDs[p.Brand]
		if !ok {
			row, err := store.InsertBrand(ctx, sqlc.InsertBrandParams{
				Name:        prettyBrand(p.Brand),
				Slug:        p.Brand,
				Description: str("Wikidata kaydından eklenen marka."),
			})
			if err != nil {
				return fmt.Errorf("brand %s: %w", p.Brand, err)
			}
			brand = row
			brandIDs[p.Brand] = brand
		}
		row, err := store.InsertPen(ctx, sqlc.InsertPenParams{
			BrandID: brand.ID, Name: p.Name, Slug: p.Slug, Description: p.Desc,
			Type: p.Type, InkType: p.Ink, TipSize: p.Tip, Price: p.Price, Weight: p.Weight,
			Length: num(p.Length), GripMaterial: str(p.Grip), BodyMaterial: str(p.Body), Color: str(p.Color),
			SmoothnessScore: p.Smooth, ComfortScore: p.Comfort, DurabilityScore: p.Dura,
			PrecisionScore: p.Prec, DesignScore: p.Design, GripScore: p.GripS, InkQuality: p.InkQ,
			ImageUrl: str(p.Hex), WhyGood: str(p.Why), SuitableFor: str(p.Suitable), NotSuitableFor: str(p.NotSuitable),
		})
		if err != nil {
			return fmt.Errorf("pen %s: %w", p.Slug, err)
		}
		if cat, ok := catIDs[p.Category]; ok {
			_ = store.AttachPenCategory(ctx, sqlc.AttachPenCategoryParams{PenID: row.ID, CategoryID: cat.ID})
		}
		for _, t := range p.Tags {
			if tag, ok := tagIDs[t]; ok {
				_ = store.AttachPenTag(ctx, sqlc.AttachPenTagParams{PenID: row.ID, TagID: tag.ID})
			}
		}
		for k, v := range featureVals(p) {
			if fid, ok := featIDs[k]; ok {
				_ = store.UpsertFeatureValue(ctx, sqlc.UpsertFeatureValueParams{PenID: row.ID, FeatureID: fid.ID, Value: v})
			}
		}
		rev := reviewPool[i%len(reviewPool)]
		u := seededUsers[i%len(seededUsers)]
		_ = store.InsertReviewIfMissing(ctx, sqlc.InsertReviewIfMissingParams{
			UserID: u.ID, PenID: row.ID, Rating: rev.rating, Title: str(rev.title), Body: rev.body,
		})
	}
	return nil
}

func applyCatalog(ctx context.Context, pens []penDef) []penDef {
	queries := map[string]string{}
	index := map[string]int{}
	for i, p := range pens {
		index[p.Slug] = i
		queries[p.Slug] = p.Brand + " " + p.Name + " pen"
	}
	data := catalog.Load(ctx, queries)
	for slug, img := range data.Images {
		if i, ok := index[slug]; ok {
			pens[i].Hex = img
		}
	}
	for _, ex := range data.Extras {
		brand := makerSlug(ex.Brand)
		slug := catalog.Slugify(brand + "-" + ex.Name)
		if i, ok := index[slug]; ok {
			if strings.HasPrefix(pens[i].Hex, "#") && ex.ImageURL != "" {
				pens[i].Hex = ex.ImageURL
			}
		}
	}
	return pens
}

func makerSlug(name string) string {
	l := strings.ToLower(name)
	switch {
	case strings.Contains(l, "parker"):
		return "parker"
	case strings.Contains(l, "pilot"):
		return "pilot"
	case strings.Contains(l, "lamy"):
		return "lamy"
	case strings.Contains(l, "montblanc"):
		return "montblanc"
	case strings.Contains(l, "bic"):
		return "bic"
	case strings.Contains(l, "sailor"):
		return "sailor"
	case strings.Contains(l, "kaweco"):
		return "kaweco"
	case strings.Contains(l, "rotring"):
		return "rotring"
	case strings.Contains(l, "pentel"):
		return "pentel"
	case strings.Contains(l, "zebra"):
		return "zebra"
	case strings.Contains(l, "uni") || strings.Contains(l, "mitsubishi"):
		return "uni"
	case strings.Contains(l, "cross"):
		return "cross"
	case strings.Contains(l, "graf"):
		return "graf-von-faber"
	case strings.Contains(l, "faber"):
		return "faber-castell"
	case strings.Contains(l, "staedtler"):
		return "staedtler"
	case strings.Contains(l, "tombow"):
		return "tombow"
	case strings.Contains(l, "caran"):
		return "caran-dache"
	case strings.Contains(l, "platinum"):
		return "platinum"
	case strings.Contains(l, "twsbi"):
		return "twsbi"
	case strings.Contains(l, "pelikan"):
		return "pelikan"
	case strings.Contains(l, "waterman"):
		return "waterman"
	case strings.Contains(l, "sakura"):
		return "sakura"
	case strings.Contains(l, "paper"):
		return "paper-mate"
	case strings.Contains(l, "schneider"):
		return "schneider"
	case strings.Contains(l, "ohto"):
		return "ohto"
	case strings.Contains(l, "serve"):
		return "serve"
	case strings.Contains(l, "adel"):
		return "adel"
	case strings.Contains(l, "diplomat"):
		return "diplomat"
	case strings.Contains(l, "jinhao"):
		return "jinhao"
	case strings.Contains(l, "hongdian"):
		return "hongdian"
	case strings.Contains(l, "sheaffer"):
		return "sheaffer"
	case strings.Contains(l, "leuchtturm"):
		return "leuchtturm"
	case strings.Contains(l, "sharpie"):
		return "sharpie"
	case strings.Contains(l, "stabilo"):
		return "stabilo"
	case strings.Contains(l, "monami"):
		return "monami"
	case strings.Contains(l, "fisher"):
		return "fisher"
	default:
		return catalog.Slugify(name)
	}
}

func featureVals(p penDef) map[string]string {
	refill := "yedek uç"
	switch p.Type {
	case "fountain":
		refill = "kartuş / converter"
	case "mechanical":
		refill = "grafit uç"
	}
	mech := "kapaklı"
	blob := strings.ToLower(p.Name + " " + p.Slug + " " + p.Type)
	switch p.Type {
	case "mechanical", "gel", "ballpoint":
		mech = "tıklamalı"
	}
	if strings.Contains(blob, "vanishing") || strings.Contains(blob, "tipo") || strings.Contains(blob, "dialog") {
		mech = "tıklamalı / çevirmeli"
	}
	if p.Type == "fountain" && !strings.Contains(blob, "vanishing") && !strings.Contains(blob, "dialog") {
		mech = "kapaklı"
	}
	if p.Type == "rollerball" && !strings.Contains(blob, "tipo") {
		mech = "kapaklı"
	}
	return map[string]string{"refill": refill, "retractable": mech, "clip": "var"}
}

func prettyBrand(slug string) string {
	if slug == "" {
		return slug
	}
	parts := strings.Split(slug, "-")
	for i, p := range parts {
		if p == "" {
			continue
		}
		parts[i] = strings.ToUpper(p[:1]) + p[1:]
	}
	return strings.Join(parts, " ")
}
