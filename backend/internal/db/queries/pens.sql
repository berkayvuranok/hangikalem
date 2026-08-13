-- name: ListPens :many
SELECT
    p.*,
    b.name AS brand_name,
    b.slug AS brand_slug,
    COALESCE(AVG(r.rating), 0)::float AS avg_rating,
    COUNT(r.id)::int AS review_count
FROM pens p
JOIN brands b ON b.id = p.brand_id
LEFT JOIN reviews r ON r.pen_id = p.id
WHERE
    (sqlc.narg('brand_slug')::text IS NULL OR b.slug = sqlc.narg('brand_slug'))
    AND (sqlc.narg('type')::text IS NULL OR p.type = sqlc.narg('type'))
    AND (sqlc.narg('ink_type')::text IS NULL OR p.ink_type = sqlc.narg('ink_type'))
    AND (sqlc.narg('tip_size')::text IS NULL OR p.tip_size = sqlc.narg('tip_size'))
    AND (sqlc.narg('color')::text IS NULL OR p.color ILIKE sqlc.narg('color'))
    AND (sqlc.narg('min_price')::numeric IS NULL OR p.price >= sqlc.narg('min_price'))
    AND (sqlc.narg('max_price')::numeric IS NULL OR p.price <= sqlc.narg('max_price'))
    AND (sqlc.narg('min_weight')::numeric IS NULL OR p.weight >= sqlc.narg('min_weight'))
    AND (sqlc.narg('max_weight')::numeric IS NULL OR p.weight <= sqlc.narg('max_weight'))
    AND (sqlc.narg('min_rating')::float IS NULL OR (
        SELECT COALESCE(AVG(r2.rating), 0) FROM reviews r2 WHERE r2.pen_id = p.id
    ) >= sqlc.narg('min_rating'))
    AND (
        sqlc.narg('purpose')::text IS NULL OR EXISTS (
            SELECT 1 FROM pen_tags pt
            JOIN tags t ON t.id = pt.tag_id
            WHERE pt.pen_id = p.id AND t.slug = sqlc.narg('purpose')
        )
    )
GROUP BY p.id, b.name, b.slug
ORDER BY avg_rating DESC, p.name ASC
LIMIT sqlc.arg('limit_count') OFFSET sqlc.arg('offset_count');

-- name: CountPens :one
SELECT COUNT(*)::int
FROM pens p
JOIN brands b ON b.id = p.brand_id
WHERE
    (sqlc.narg('brand_slug')::text IS NULL OR b.slug = sqlc.narg('brand_slug'))
    AND (sqlc.narg('type')::text IS NULL OR p.type = sqlc.narg('type'))
    AND (sqlc.narg('ink_type')::text IS NULL OR p.ink_type = sqlc.narg('ink_type'))
    AND (sqlc.narg('tip_size')::text IS NULL OR p.tip_size = sqlc.narg('tip_size'))
    AND (sqlc.narg('color')::text IS NULL OR p.color ILIKE sqlc.narg('color'))
    AND (sqlc.narg('min_price')::numeric IS NULL OR p.price >= sqlc.narg('min_price'))
    AND (sqlc.narg('max_price')::numeric IS NULL OR p.price <= sqlc.narg('max_price'))
    AND (sqlc.narg('min_weight')::numeric IS NULL OR p.weight >= sqlc.narg('min_weight'))
    AND (sqlc.narg('max_weight')::numeric IS NULL OR p.weight <= sqlc.narg('max_weight'))
    AND (sqlc.narg('min_rating')::float IS NULL OR (
        SELECT COALESCE(AVG(r2.rating), 0) FROM reviews r2 WHERE r2.pen_id = p.id
    ) >= sqlc.narg('min_rating'))
    AND (
        sqlc.narg('purpose')::text IS NULL OR EXISTS (
            SELECT 1 FROM pen_tags pt
            JOIN tags t ON t.id = pt.tag_id
            WHERE pt.pen_id = p.id AND t.slug = sqlc.narg('purpose')
        )
    );

-- name: GetPenBySlug :one
SELECT
    p.*,
    b.name AS brand_name,
    b.slug AS brand_slug,
    COALESCE(AVG(r.rating), 0)::float AS avg_rating,
    COUNT(r.id)::int AS review_count
FROM pens p
JOIN brands b ON b.id = p.brand_id
LEFT JOIN reviews r ON r.pen_id = p.id
WHERE p.slug = $1
GROUP BY p.id, b.name, b.slug;

-- name: GetPenByID :one
SELECT
    p.*,
    b.name AS brand_name,
    b.slug AS brand_slug,
    COALESCE(AVG(r.rating), 0)::float AS avg_rating,
    COUNT(r.id)::int AS review_count
FROM pens p
JOIN brands b ON b.id = p.brand_id
LEFT JOIN reviews r ON r.pen_id = p.id
WHERE p.id = $1
GROUP BY p.id, b.name, b.slug;

-- name: ListPensByIDs :many
SELECT
    p.*,
    b.name AS brand_name,
    b.slug AS brand_slug,
    COALESCE(AVG(r.rating), 0)::float AS avg_rating,
    COUNT(r.id)::int AS review_count
FROM pens p
JOIN brands b ON b.id = p.brand_id
LEFT JOIN reviews r ON r.pen_id = p.id
WHERE p.id = ANY(sqlc.arg('ids')::uuid[])
GROUP BY p.id, b.name, b.slug;

-- name: ListPensBySlugs :many
SELECT
    p.*,
    b.name AS brand_name,
    b.slug AS brand_slug,
    COALESCE(AVG(r.rating), 0)::float AS avg_rating,
    COUNT(r.id)::int AS review_count
FROM pens p
JOIN brands b ON b.id = p.brand_id
LEFT JOIN reviews r ON r.pen_id = p.id
WHERE p.slug = ANY(sqlc.arg('slugs')::text[])
GROUP BY p.id, b.name, b.slug;

-- name: ListAllPensForRecommendation :many
SELECT
    p.*,
    b.name AS brand_name,
    b.slug AS brand_slug,
    COALESCE(AVG(r.rating), 0)::float AS avg_rating,
    COUNT(r.id)::int AS review_count
FROM pens p
JOIN brands b ON b.id = p.brand_id
LEFT JOIN reviews r ON r.pen_id = p.id
GROUP BY p.id, b.name, b.slug;

-- name: SearchPens :many
SELECT
    p.*,
    b.name AS brand_name,
    b.slug AS brand_slug,
    COALESCE(AVG(r.rating), 0)::float AS avg_rating,
    COUNT(r.id)::int AS review_count
FROM pens p
JOIN brands b ON b.id = p.brand_id
LEFT JOIN reviews r ON r.pen_id = p.id
WHERE p.name ILIKE '%' || sqlc.arg('query') || '%'
   OR b.name ILIKE '%' || sqlc.arg('query') || '%'
   OR p.slug ILIKE '%' || sqlc.arg('query') || '%'
GROUP BY p.id, b.name, b.slug
ORDER BY GREATEST(similarity(p.name, sqlc.arg('query')), similarity(b.name, sqlc.arg('query'))) DESC
LIMIT 12;

-- name: ListPopularPens :many
SELECT
    p.*,
    b.name AS brand_name,
    b.slug AS brand_slug,
    COALESCE(AVG(r.rating), 0)::float AS avg_rating,
    COUNT(r.id)::int AS review_count
FROM pens p
JOIN brands b ON b.id = p.brand_id
LEFT JOIN reviews r ON r.pen_id = p.id
GROUP BY p.id, b.name, b.slug
ORDER BY avg_rating DESC, review_count DESC
LIMIT $1;

-- name: GetPenTags :many
SELECT t.*
FROM tags t
JOIN pen_tags pt ON pt.tag_id = t.id
WHERE pt.pen_id = $1
ORDER BY t.name;

-- name: GetPenFeatureValues :many
SELECT f.key, f.label, v.value
FROM pen_feature_values v
JOIN pen_features f ON f.id = v.feature_id
WHERE v.pen_id = $1
ORDER BY f.label;

-- name: ListTags :many
SELECT * FROM tags ORDER BY name;

-- name: CountPensTotal :one
SELECT COUNT(*)::int FROM pens;
