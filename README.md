# HangiKalem

Sana uygun kalemi bulan premium bir ürün keşif platformu. Liste değil; yazım tarzına, amaca ve bütçeye göre skorlanmış bir cevap.

> “Ben hangi kalemi almalıyım?”

## Mimari

```
Browser  →  React (Vite)  →  REST + JWT  →  Gin
                                           →  sqlc / PostgreSQL
                                           →  Redis (rate limit)
```

Katmanlar: `handler → service → repository → PostgreSQL`. Öneri motoru servis katmanında çalışır.

```
hangikalem/
  frontend/     React 19, TypeScript, Tailwind, Framer Motion
  backend/      Go, Gin, sqlc, PostgreSQL
  docker-compose.yml
```

## Tech stack

**Frontend:** React, TypeScript (strict), Vite, Tailwind CSS, Framer Motion, React Router, TanStack Query, Zustand, Lucide.

**Backend:** Go, Gin, sqlc, PostgreSQL 16, JWT + bcrypt, Redis, Docker.

## Kurulum

### Docker (önerilen)

```bash
cp .env.example .env
docker compose up --build
```

- Uygulama: http://localhost:5173
- API: http://localhost:8080
- Health: http://localhost:8080/health

### Yerel geliştirme

PostgreSQL 16 ve Redis 7 ayakta olsun, ardından:

```bash
cp .env.example .env

# backend
cd backend
go run ./cmd/server

# frontend (ayrı terminal)
cd frontend
npm install
npm run dev
```

Sunucu ayağa kalkınca migration ve seed otomatik çalışır.

## Environment variables

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | Postgres bağlantısı |
| `REDIS_URL` | Redis (opsiyonel; yoksa rate limit kapanır) |
| `JWT_SECRET` | Access/refresh imza anahtarı |
| `FRONTEND_URL` | CORS origin |
| `PORT` | API portu (varsayılan 8080) |
| `VITE_API_URL` | Tarayıcının konuşacağı API kökü |

Sırlar kaynak koda yazılmaz.

## Database

Migration: `backend/migrations/`. sqlc sorguları: `backend/internal/db/queries/`.

Şema: `users`, `brands`, `categories`, `pens`, `pen_features`, `pen_feature_values`, `tags`, `pen_tags`, `favorites`, `comparisons`, `reviews`, `refresh_tokens`.

Seed, sunucu açılışında **Wikidata SPARQL**, **Wikimedia Commons** ve **Wikipedia REST** API’lerinden kalem modeli + gerçek görsel çeker. API yoksa veya zaman aşımı olursa yerel katalog yedek olarak kalır.

Elle seed / yenileme:

```bash
cd backend && go run ./cmd/seed
# veya
curl -X POST http://localhost:8080/api/catalog/sync
```

sqlc yeniden üretmek için:

```bash
cd backend && sqlc generate
```

## API

| | |
|---|---|
| `GET /api/pens` | Filtre + sayfalama (`brand`, `type`, `ink_type`, `tip_size`, `color`, `purpose`, `min_price`, `max_price`, `min_weight`, `max_weight`, `min_rating`) |
| `GET /api/pens/:slug` | Detay |
| `GET /api/brands` | Markalar |
| `GET /api/search?q=` | Marka + kalem |
| `POST /api/recommendations` | Wizard cevaplarından skor |
| `POST /api/compare` | `{ "slugs": ["a","b"] }` (2–4) |
| `POST /api/pens/:slug/fit` | “Bu kalem sana uygun mu?” |
| `GET /api/pens/:slug/reviews` | Yorumlar |
| `POST /api/auth/register` `login` `refresh` `logout` | JWT |
| `GET /api/auth/me` | Profil (JWT) |
| `GET/POST/DELETE /api/favorites/:penId` | Favoriler (JWT) |
| `POST /api/catalog/sync` | Wikidata + Wikimedia Commons + Wikipedia’dan kalem kataloğunu yenile |
| `POST /api/pens/:slug/reviews` | Yorum yaz (JWT) |

Örnek öneri:

```json
POST /api/recommendations
{
  "purpose": "study",
  "writing_thickness": "fine",
  "ink_type": "gel",
  "smoothness": 9,
  "weight_preference": 3,
  "budget": 500,
  "priorities": ["comfort", "writing_quality"]
}
```

## Geliştirme komutları

```bash
# frontend
cd frontend
npm run dev
npm run build
npm run lint

# backend
cd backend
go build ./...
go run ./cmd/server
```

## Production build

```bash
docker compose up --build -d
```

Frontend Nginx ile statik servis edilir; API `VITE_API_URL` ile tarayıcıdan `localhost:8080` adresine gider.

## Demo hesaplar (seed)

- `admin@hangikalem.com` / `password123` (yönetici — `/admin/users`)
- `ayse@example.com` / `password123`
- `mert@example.com` / `password123`
- `elif@example.com` / `password123`
