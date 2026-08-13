package handler

import (
	"net/http"
	"os"
	"strings"
	"time"

	"hangikalem/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

func (a *API) Router(rdb *redis.Client) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery(), middleware.CORS(a.Cfg))
	r.Use(middleware.RateLimit(rdb, 120, time.Minute))

	r.GET("/health", a.Health)

	api := r.Group("/api")
	{
		api.GET("/pens", a.ListPens)
		api.GET("/pens/popular", a.Popular)
		api.GET("/pens/:slug", a.GetPen)
		api.POST("/pens/:slug/fit", a.Fit)
		api.GET("/pens/:slug/reviews", a.Reviews)
		api.GET("/brands", a.Brands)
		api.GET("/brands/:slug", a.Brand)
		api.GET("/search", a.Search)
		api.POST("/recommendations", a.Recommend)
		api.GET("/guides", a.Guides)
		api.POST("/compare", a.Compare)
		api.POST("/catalog/sync", a.SyncCatalog)
		api.GET("/reviews/recent", a.RecentReviews)

		auth := api.Group("/auth")
		auth.Use(middleware.RateLimit(rdb, 20, time.Minute))
		{
			auth.POST("/register", a.Register)
			auth.POST("/login", a.Login)
			auth.POST("/refresh", a.Refresh)
			auth.POST("/logout", a.Logout)
		}

		protected := api.Group("/")
		protected.Use(middleware.Auth(a.Cfg.JWTSecret))
		{
			protected.GET("/auth/me", a.Me)
			protected.GET("/favorites", a.Favorites)
			protected.POST("/favorites/:penId", a.AddFavorite)
			protected.DELETE("/favorites/:penId", a.RemoveFavorite)
			protected.POST("/pens/:slug/reviews", a.CreateReview)
		}

		admin := api.Group("/admin")
		admin.Use(middleware.Auth(a.Cfg.JWTSecret), middleware.RequireAdmin())
		{
		admin.GET("/users", a.AdminUsers)
			admin.GET("/db", a.AdminTables)
			admin.GET("/db/:table", a.AdminTableRows)
		}
	}

	if dir := strings.TrimSpace(a.Cfg.StaticDir); dir != "" {
		r.NoRoute(func(c *gin.Context) {
			if strings.HasPrefix(c.Request.URL.Path, "/api") {
				c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
				return
			}
			reqPath := c.Request.URL.Path
			if reqPath == "/" {
				c.File(dir + "/index.html")
				return
			}
			full := dir + reqPath
			if info, err := os.Stat(full); err == nil && !info.IsDir() {
				c.File(full)
				return
			}
			c.File(dir + "/index.html")
		})
	}
	return r
}
