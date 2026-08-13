package middleware

import (
	"net/http"
	"strings"

	"hangikalem/internal/config"
	"hangikalem/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const UserIDKey = "user_id"
const UserRoleKey = "user_role"
const UserEmailKey = "user_email"

func CORS(cfg config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if originAllowed(origin, cfg) {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		}
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func originAllowed(origin string, cfg config.Config) bool {
	if origin == "" {
		return false
	}
	if cfg.IsDev() && strings.HasPrefix(origin, "http://localhost") {
		return true
	}
	for _, raw := range strings.Split(cfg.FrontendURL, ",") {
		allowed := strings.TrimSpace(raw)
		if allowed != "" && origin == allowed {
			return true
		}
	}
	return false
}

func Auth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			utils.JSONError(c, http.StatusUnauthorized, "Oturum gerekli")
			c.Abort()
			return
		}
		claims, err := utils.ParseAccessToken(secret, strings.TrimPrefix(header, "Bearer "))
		if err != nil {
			utils.JSONError(c, http.StatusUnauthorized, "Geçersiz veya süresi dolmuş oturum")
			c.Abort()
			return
		}
		c.Set(UserIDKey, claims.UserID)
		c.Set(UserRoleKey, claims.Role)
		c.Set(UserEmailKey, claims.Email)
		c.Next()
	}
}

func OptionalAuth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if strings.HasPrefix(header, "Bearer ") {
			if claims, err := utils.ParseAccessToken(secret, strings.TrimPrefix(header, "Bearer ")); err == nil {
				c.Set(UserIDKey, claims.UserID)
				c.Set(UserRoleKey, claims.Role)
				c.Set(UserEmailKey, claims.Email)
			}
		}
		c.Next()
	}
}

func UserID(c *gin.Context) (uuid.UUID, bool) {
	v, ok := c.Get(UserIDKey)
	if !ok {
		return uuid.Nil, false
	}
	id, ok := v.(uuid.UUID)
	return id, ok
}

func UserRole(c *gin.Context) string {
	v, ok := c.Get(UserRoleKey)
	if !ok {
		return ""
	}
	role, _ := v.(string)
	return role
}

func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		if UserRole(c) != "admin" {
			utils.JSONError(c, http.StatusForbidden, "Bu sayfa yalnızca yöneticilere açık")
			c.Abort()
			return
		}
		c.Next()
	}
}
