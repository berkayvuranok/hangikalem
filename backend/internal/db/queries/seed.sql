-- name: InsertBrand :one
INSERT INTO brands (name, slug, description)
VALUES ($1, $2, $3)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
RETURNING *;

-- name: InsertCategory :one
INSERT INTO categories (name, slug)
VALUES ($1, $2)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
RETURNING *;

-- name: InsertTag :one
INSERT INTO tags (name, slug)
VALUES ($1, $2)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
RETURNING *;

-- name: InsertFeature :one
INSERT INTO pen_features (key, label)
VALUES ($1, $2)
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label
RETURNING *;

-- name: InsertPen :one
INSERT INTO pens (
    brand_id, name, slug, description, type, ink_type, tip_size, price, weight, length,
    grip_material, body_material, color, smoothness_score, comfort_score, durability_score,
    precision_score, design_score, grip_score, ink_quality, image_url, why_good, suitable_for, not_suitable_for
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
    $11, $12, $13, $14, $15, $16,
    $17, $18, $19, $20, $21, $22, $23, $24
)
ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    ink_type = EXCLUDED.ink_type,
    tip_size = EXCLUDED.tip_size,
    price = EXCLUDED.price,
    weight = EXCLUDED.weight,
    length = EXCLUDED.length,
    grip_material = EXCLUDED.grip_material,
    body_material = EXCLUDED.body_material,
    color = EXCLUDED.color,
    smoothness_score = EXCLUDED.smoothness_score,
    comfort_score = EXCLUDED.comfort_score,
    durability_score = EXCLUDED.durability_score,
    precision_score = EXCLUDED.precision_score,
    design_score = EXCLUDED.design_score,
    grip_score = EXCLUDED.grip_score,
    ink_quality = EXCLUDED.ink_quality,
    image_url = EXCLUDED.image_url,
    why_good = EXCLUDED.why_good,
    suitable_for = EXCLUDED.suitable_for,
    not_suitable_for = EXCLUDED.not_suitable_for,
    updated_at = NOW()
RETURNING *;

-- name: AttachPenTag :exec
INSERT INTO pen_tags (pen_id, tag_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: AttachPenCategory :exec
INSERT INTO pen_categories (pen_id, category_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: UpsertFeatureValue :exec
INSERT INTO pen_feature_values (pen_id, feature_id, value)
VALUES ($1, $2, $3)
ON CONFLICT (pen_id, feature_id) DO UPDATE SET value = EXCLUDED.value;

-- name: InsertUserIfMissing :one
INSERT INTO users (email, password_hash, name, role)
VALUES ($1, $2, $3, $4)
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role
RETURNING *;

-- name: InsertReviewIfMissing :exec
INSERT INTO reviews (user_id, pen_id, rating, title, body)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (user_id, pen_id) DO NOTHING;
