CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
);

CREATE TABLE pens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    ink_type TEXT NOT NULL,
    tip_size TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    weight NUMERIC(6, 2) NOT NULL,
    length NUMERIC(6, 2),
    grip_material TEXT,
    body_material TEXT,
    color TEXT,
    smoothness_score NUMERIC(3, 1) NOT NULL,
    comfort_score NUMERIC(3, 1) NOT NULL,
    durability_score NUMERIC(3, 1) NOT NULL,
    precision_score NUMERIC(3, 1) NOT NULL,
    design_score NUMERIC(3, 1) NOT NULL,
    grip_score NUMERIC(3, 1) NOT NULL,
    ink_quality NUMERIC(3, 1) NOT NULL,
    image_url TEXT,
    why_good TEXT,
    suitable_for TEXT,
    not_suitable_for TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pen_categories (
    pen_id UUID NOT NULL REFERENCES pens(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (pen_id, category_id)
);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
);

CREATE TABLE pen_tags (
    pen_id UUID NOT NULL REFERENCES pens(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (pen_id, tag_id)
);

CREATE TABLE pen_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL
);

CREATE TABLE pen_feature_values (
    pen_id UUID NOT NULL REFERENCES pens(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES pen_features(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    PRIMARY KEY (pen_id, feature_id)
);

CREATE TABLE favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pen_id UUID NOT NULL REFERENCES pens(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, pen_id)
);

CREATE TABLE comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE comparison_pens (
    comparison_id UUID NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
    pen_id UUID NOT NULL REFERENCES pens(id) ON DELETE CASCADE,
    PRIMARY KEY (comparison_id, pen_id)
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pen_id UUID NOT NULL REFERENCES pens(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, pen_id)
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pens_brand_id ON pens (brand_id);
CREATE INDEX idx_pens_type ON pens (type);
CREATE INDEX idx_pens_ink_type ON pens (ink_type);
CREATE INDEX idx_pens_price ON pens (price);
CREATE INDEX idx_pens_tip_size ON pens (tip_size);
CREATE INDEX idx_pens_weight ON pens (weight);
CREATE INDEX idx_pens_color ON pens (color);
CREATE INDEX idx_reviews_pen_id ON reviews (pen_id);
CREATE INDEX idx_favorites_user_id ON favorites (user_id);
CREATE INDEX idx_pens_name_trgm ON pens USING gin (name gin_trgm_ops);
CREATE INDEX idx_brands_name_trgm ON brands USING gin (name gin_trgm_ops);
