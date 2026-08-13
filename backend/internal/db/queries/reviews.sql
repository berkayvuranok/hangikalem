-- name: ListReviewsByPen :many
SELECT r.*, u.name AS user_name
FROM reviews r
JOIN users u ON u.id = r.user_id
WHERE r.pen_id = $1
ORDER BY r.created_at DESC;

-- name: CreateReview :one
INSERT INTO reviews (user_id, pen_id, rating, title, body)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetReviewByUserAndPen :one
SELECT * FROM reviews WHERE user_id = $1 AND pen_id = $2;

-- name: ListRecentReviews :many
SELECT r.*, u.name AS user_name, p.name AS pen_name, p.slug AS pen_slug, b.name AS brand_name
FROM reviews r
JOIN users u ON u.id = r.user_id
JOIN pens p ON p.id = r.pen_id
JOIN brands b ON b.id = p.brand_id
ORDER BY r.created_at DESC
LIMIT $1;
