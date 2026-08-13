package middleware

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"hangikalem/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

func RateLimit(rdb *redis.Client, limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		if rdb == nil {
			c.Next()
			return
		}
		ip := c.ClientIP()
		key := fmt.Sprintf("rl:%s:%s", ip, c.FullPath())
		ctx := context.Background()
		n, err := rdb.Incr(ctx, key).Result()
		if err != nil {
			c.Next()
			return
		}
		if n == 1 {
			_ = rdb.Expire(ctx, key, window).Err()
		}
		if n > int64(limit) {
			utils.JSONError(c, http.StatusTooManyRequests, "Çok fazla istek. Lütfen biraz bekleyin.")
			c.Abort()
			return
		}
		c.Next()
	}
}
