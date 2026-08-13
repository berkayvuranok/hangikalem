-- name: ListBrands :many
SELECT * FROM brands ORDER BY name;

-- name: GetBrandBySlug :one
SELECT * FROM brands WHERE slug = $1;

-- name: GetBrandByID :one
SELECT * FROM brands WHERE id = $1;

-- name: SearchBrands :many
SELECT * FROM brands
WHERE name ILIKE '%' || sqlc.arg('query') || '%'
   OR slug ILIKE '%' || sqlc.arg('query') || '%'
ORDER BY similarity(name, sqlc.arg('query')) DESC
LIMIT 8;
