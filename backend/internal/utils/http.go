package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func JSONError(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{"error": message})
}

func JSONOK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, data)
}

func JSONCreated(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, data)
}
