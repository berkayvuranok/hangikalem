-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: CreateUser :one
INSERT INTO users (email, password_hash, name, role)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetRefreshTokenByHash :one
SELECT * FROM refresh_tokens WHERE token_hash = $1;

-- name: DeleteRefreshToken :exec
DELETE FROM refresh_tokens WHERE token_hash = $1;

-- name: DeleteUserRefreshTokens :exec
DELETE FROM refresh_tokens WHERE user_id = $1;

-- name: ListUsersAdmin :many
SELECT
    u.id,
    u.email,
    u.name,
    u.role,
    u.created_at,
    (
        SELECT COUNT(*)::int
        FROM reviews r
        WHERE r.user_id = u.id
    ) AS review_count,
    (
        SELECT COUNT(*)::int
        FROM favorites f
        WHERE f.user_id = u.id
    ) AS favorite_count
FROM users u
ORDER BY u.created_at DESC;
