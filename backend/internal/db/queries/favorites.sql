-- name: ListFavoritesByUser :many
SELECT
    p.*,
    b.name AS brand_name,
    b.slug AS brand_slug,
    COALESCE(AVG(r.rating), 0)::float AS avg_rating,
    COUNT(r.id)::int AS review_count
FROM favorites f
JOIN pens p ON p.id = f.pen_id
JOIN brands b ON b.id = p.brand_id
LEFT JOIN reviews r ON r.pen_id = p.id
WHERE f.user_id = $1
GROUP BY p.id, b.name, b.slug, f.created_at
ORDER BY f.created_at DESC;

-- name: AddFavorite :exec
INSERT INTO favorites (user_id, pen_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: RemoveFavorite :exec
DELETE FROM favorites WHERE user_id = $1 AND pen_id = $2;

-- name: IsFavorite :one
SELECT EXISTS(
    SELECT 1 FROM favorites WHERE user_id = $1 AND pen_id = $2
)::bool AS is_favorite;
