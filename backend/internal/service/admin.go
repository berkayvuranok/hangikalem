package service

import (
	"context"
	"fmt"
	"time"

	"hangikalem/internal/model"

	"github.com/jackc/pgx/v5"
)

var adminTables = []string{
	"users",
	"brands",
	"categories",
	"pens",
	"tags",
	"reviews",
	"favorites",
	"pen_tags",
	"pen_categories",
	"pen_features",
	"pen_feature_values",
	"comparisons",
	"comparison_pens",
	"refresh_tokens",
	"schema_migrations",
}

var secretColumns = map[string]bool{
	"password_hash": true,
	"token_hash":    true,
}

func allowedTable(name string) bool {
	for _, t := range adminTables {
		if t == name {
			return true
		}
	}
	return false
}

func quoteTable(name string) string {
	return pgx.Identifier{"public", name}.Sanitize()
}

func (s *AuthService) ListTables(ctx context.Context) ([]model.AdminTable, error) {
	out := make([]model.AdminTable, 0, len(adminTables))
	for _, name := range adminTables {
		var n int64
		q := fmt.Sprintf("SELECT COUNT(*) FROM %s", quoteTable(name))
		if err := s.store.Pool.QueryRow(ctx, q).Scan(&n); err != nil {
			return nil, err
		}
		out = append(out, model.AdminTable{Name: name, Rows: int(n)})
	}
	return out, nil
}

func (s *AuthService) TableRows(ctx context.Context, name string, limit, offset int) (model.AdminTableRows, error) {
	if !allowedTable(name) {
		return model.AdminTableRows{}, ErrInvalid
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	var total int64
	countQ := fmt.Sprintf("SELECT COUNT(*) FROM %s", quoteTable(name))
	if err := s.store.Pool.QueryRow(ctx, countQ).Scan(&total); err != nil {
		return model.AdminTableRows{}, err
	}

	q := fmt.Sprintf("SELECT * FROM %s LIMIT $1 OFFSET $2", quoteTable(name))
	rows, err := s.store.Pool.Query(ctx, q, limit, offset)
	if err != nil {
		return model.AdminTableRows{}, err
	}
	defer rows.Close()

	fds := rows.FieldDescriptions()
	cols := make([]string, 0, len(fds))
	for _, fd := range fds {
		cols = append(cols, fd.Name)
	}

	items := make([]map[string]any, 0, limit)
	for rows.Next() {
		vals, err := rows.Values()
		if err != nil {
			return model.AdminTableRows{}, err
		}
		row := map[string]any{}
		for i, col := range cols {
			if secretColumns[col] {
				if vals[i] == nil {
					row[col] = nil
				} else {
					row[col] = "••••••"
				}
				continue
			}
			row[col] = jsonValue(vals[i])
		}
		items = append(items, row)
	}
	if err := rows.Err(); err != nil {
		return model.AdminTableRows{}, err
	}

	return model.AdminTableRows{
		Name:    name,
		Columns: cols,
		Items:   items,
		Total:   int(total),
		Limit:   limit,
		Offset:  offset,
	}, nil
}

func jsonValue(v any) any {
	switch t := v.(type) {
	case time.Time:
		return t.UTC().Format(time.RFC3339)
	case []byte:
		return string(t)
	default:
		return v
	}
}
