package handler

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"hangikalem/internal/config"
	"hangikalem/internal/middleware"
	"hangikalem/internal/model"
	"hangikalem/internal/service"
	"hangikalem/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type API struct {
	Pens *service.PenService
	Auth *service.AuthService
	Cfg  config.Config
	Sync func(ctx context.Context) error
}

func (a *API) ListPens(c *gin.Context) {
	f := service.PenFilter{
		BrandSlug: service.QueryPtr(c.Query("brand")),
		Type:      service.QueryPtr(c.Query("type")),
		InkType:   service.QueryPtr(c.Query("ink_type")),
		TipSize:   service.QueryPtr(c.Query("tip_size")),
		Color:     service.QueryPtr(c.Query("color")),
		Purpose:   service.QueryPtr(c.Query("purpose")),
		MinPrice:  service.ParseFloatQuery(c.Query("min_price")),
		MaxPrice:  service.ParseFloatQuery(c.Query("max_price")),
		MinWeight: service.ParseFloatQuery(c.Query("min_weight")),
		MaxWeight: service.ParseFloatQuery(c.Query("max_weight")),
		MinRating: service.ParseFloatQuery(c.Query("min_rating")),
		Page:      service.ParseIntQuery(c.Query("page"), 1),
		Limit:     service.ParseIntQuery(c.Query("limit"), 200),
	}
	res, err := a.Pens.List(c.Request.Context(), f)
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "Kalemler yüklenemedi")
		return
	}
	utils.JSONOK(c, res)
}

func (a *API) GetPen(c *gin.Context) {
	pen, err := a.Pens.GetBySlug(c.Request.Context(), c.Param("slug"))
	if err != nil {
		writeErr(c, err)
		return
	}
	utils.JSONOK(c, pen)
}

func (a *API) Popular(c *gin.Context) {
	res, err := a.Pens.Popular(c.Request.Context(), 16)
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "Popüler kalemler yüklenemedi")
		return
	}
	utils.JSONOK(c, gin.H{"items": res})
}

func (a *API) Brands(c *gin.Context) {
	res, err := a.Pens.Brands(c.Request.Context())
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "Markalar yüklenemedi")
		return
	}
	utils.JSONOK(c, gin.H{"items": res})
}

func (a *API) Brand(c *gin.Context) {
	res, err := a.Pens.BrandBySlug(c.Request.Context(), c.Param("slug"))
	if err != nil {
		writeErr(c, err)
		return
	}
	utils.JSONOK(c, res)
}

func (a *API) Search(c *gin.Context) {
	res, err := a.Pens.Search(c.Request.Context(), c.Query("q"))
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "Arama başarısız")
		return
	}
	utils.JSONOK(c, res)
}

func (a *API) Recommend(c *gin.Context) {
	var req model.RecommendationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.JSONError(c, http.StatusBadRequest, "Geçersiz öneri isteği")
		return
	}
	items, err := a.Pens.Recommend(c.Request.Context(), req)
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "Öneriler hesaplanamadı")
		return
	}
	utils.JSONOK(c, gin.H{"recommendations": items})
}

func (a *API) Guides(c *gin.Context) {
	items, err := a.Pens.Guides(c.Request.Context())
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "Rehberler yüklenemedi")
		return
	}
	utils.JSONOK(c, gin.H{"items": items})
}

func (a *API) Fit(c *gin.Context) {
	var req model.RecommendationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.JSONError(c, http.StatusBadRequest, "Geçersiz istek")
		return
	}
	pen, err := a.Pens.GetBySlug(c.Request.Context(), c.Param("slug"))
	if err != nil {
		writeErr(c, err)
		return
	}
	utils.JSONOK(c, service.FitScore(req, pen))
}

func (a *API) Compare(c *gin.Context) {
	var req model.CompareRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.JSONError(c, http.StatusBadRequest, "En az 2, en fazla 4 kalem seçin")
		return
	}
	res, err := a.Pens.Compare(c.Request.Context(), req.Slugs)
	if err != nil {
		writeErr(c, err)
		return
	}
	utils.JSONOK(c, res)
}

func (a *API) Reviews(c *gin.Context) {
	pen, err := a.Pens.GetBySlug(c.Request.Context(), c.Param("slug"))
	if err != nil {
		writeErr(c, err)
		return
	}
	items, err := a.Pens.Reviews(c.Request.Context(), pen.ID)
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "Yorumlar yüklenemedi")
		return
	}
	utils.JSONOK(c, gin.H{"items": items})
}

func (a *API) CreateReview(c *gin.Context) {
	userID, ok := middleware.UserID(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "Oturum gerekli")
		return
	}
	pen, err := a.Pens.GetBySlug(c.Request.Context(), c.Param("slug"))
	if err != nil {
		writeErr(c, err)
		return
	}
	var body struct {
		Rating int16   `json:"rating" binding:"required"`
		Title  *string `json:"title"`
		Body   string  `json:"body" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.JSONError(c, http.StatusBadRequest, "Geçersiz yorum")
		return
	}
	rev, err := a.Pens.CreateReview(c.Request.Context(), userID, pen.ID, body.Rating, body.Title, body.Body)
	if err != nil {
		writeErr(c, err)
		return
	}
	utils.JSONCreated(c, rev)
}

func (a *API) RecentReviews(c *gin.Context) {
	items, err := a.Pens.RecentReviews(c.Request.Context(), 6)
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "Yorumlar yüklenemedi")
		return
	}
	utils.JSONOK(c, gin.H{"items": items})
}

func (a *API) Favorites(c *gin.Context) {
	userID, _ := middleware.UserID(c)
	items, err := a.Pens.Favorites(c.Request.Context(), userID)
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "Favoriler yüklenemedi")
		return
	}
	utils.JSONOK(c, gin.H{"items": items})
}

func (a *API) AddFavorite(c *gin.Context) {
	userID, _ := middleware.UserID(c)
	penID, err := uuid.Parse(c.Param("penId"))
	if err != nil {
		utils.JSONError(c, http.StatusBadRequest, "Geçersiz kalem")
		return
	}
	if err := a.Pens.AddFavorite(c.Request.Context(), userID, penID); err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "Favori eklenemedi")
		return
	}
	c.Status(http.StatusNoContent)
}

func (a *API) RemoveFavorite(c *gin.Context) {
	userID, _ := middleware.UserID(c)
	penID, err := uuid.Parse(c.Param("penId"))
	if err != nil {
		utils.JSONError(c, http.StatusBadRequest, "Geçersiz kalem")
		return
	}
	if err := a.Pens.RemoveFavorite(c.Request.Context(), userID, penID); err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "Favori silinemedi")
		return
	}
	c.Status(http.StatusNoContent)
}

func (a *API) Register(c *gin.Context) {
	var body struct {
		Name     string `json:"name" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.JSONError(c, http.StatusBadRequest, "Geçerli ad, e-posta ve en az 8 karakter şifre girin")
		return
	}
	pair, err := a.Auth.Register(c.Request.Context(), body.Name, body.Email, body.Password)
	if err != nil {
		writeErr(c, err)
		return
	}
	a.setRefresh(c, pair.RefreshToken)
	utils.JSONCreated(c, gin.H{"access_token": pair.AccessToken, "user": pair.User})
}

func (a *API) Login(c *gin.Context) {
	var body struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.JSONError(c, http.StatusBadRequest, "E-posta ve şifre gerekli")
		return
	}
	pair, err := a.Auth.Login(c.Request.Context(), body.Email, body.Password)
	if err != nil {
		writeErr(c, err)
		return
	}
	a.setRefresh(c, pair.RefreshToken)
	utils.JSONOK(c, gin.H{"access_token": pair.AccessToken, "user": pair.User})
}

func (a *API) Refresh(c *gin.Context) {
	raw, _ := c.Cookie("refresh_token")
	pair, err := a.Auth.Refresh(c.Request.Context(), raw)
	if err != nil {
		writeErr(c, err)
		return
	}
	a.setRefresh(c, pair.RefreshToken)
	utils.JSONOK(c, gin.H{"access_token": pair.AccessToken, "user": pair.User})
}

func (a *API) Logout(c *gin.Context) {
	raw, _ := c.Cookie("refresh_token")
	_ = a.Auth.Logout(c.Request.Context(), raw)
	c.SetCookie("refresh_token", "", -1, "/", "", !a.Cfg.IsDev(), true)
	c.Status(http.StatusNoContent)
}

func (a *API) Me(c *gin.Context) {
	userID, _ := middleware.UserID(c)
	user, err := a.Auth.Me(c.Request.Context(), userID)
	if err != nil {
		writeErr(c, err)
		return
	}
	utils.JSONOK(c, user)
}

func (a *API) AdminUsers(c *gin.Context) {
	items, err := a.Auth.ListUsers(c.Request.Context())
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "Kullanıcılar yüklenemedi")
		return
	}
	utils.JSONOK(c, gin.H{"items": items})
}

func (a *API) AdminTables(c *gin.Context) {
	items, err := a.Auth.ListTables(c.Request.Context())
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "Tablolar yüklenemedi")
		return
	}
	utils.JSONOK(c, gin.H{"items": items})
}

func (a *API) AdminTableRows(c *gin.Context) {
	limit := service.ParseIntQuery(c.Query("limit"), 50)
	offset := service.ParseIntQuery(c.Query("offset"), 0)
	res, err := a.Auth.TableRows(c.Request.Context(), c.Param("table"), limit, offset)
	if err != nil {
		writeErr(c, err)
		return
	}
	utils.JSONOK(c, res)
}

func (a *API) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (a *API) SyncCatalog(c *gin.Context) {
	if a.Sync == nil {
		utils.JSONError(c, http.StatusNotImplemented, "Katalog senkronu yok")
		return
	}
	if err := a.Sync(c.Request.Context()); err != nil {
		utils.JSONError(c, http.StatusBadGateway, "Katalog API’lerinden veri alınamadı")
		return
	}
	utils.JSONOK(c, gin.H{"status": "ok", "source": "wikidata+commons+wikipedia"})
}

func (a *API) setRefresh(c *gin.Context, token string) {
	secure := !a.Cfg.IsDev()
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("refresh_token", token, int(a.Cfg.RefreshTokenTTL.Seconds()), "/", "", secure, true)
}

func writeErr(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrNotFound):
		utils.JSONError(c, http.StatusNotFound, "Bulunamadı")
	case errors.Is(err, service.ErrInvalid):
		utils.JSONError(c, http.StatusBadRequest, "Geçersiz istek")
	case errors.Is(err, service.ErrConflict):
		utils.JSONError(c, http.StatusConflict, "Bu kayıt zaten mevcut")
	case errors.Is(err, service.ErrUnauthorized):
		utils.JSONError(c, http.StatusUnauthorized, "E-posta veya şifre hatalı")
	case errors.Is(err, service.ErrForbidden):
		utils.JSONError(c, http.StatusForbidden, "Bu sayfa yalnızca yöneticilere açık")
	default:
		if strings.Contains(err.Error(), "duplicate") {
			utils.JSONError(c, http.StatusConflict, "Bu kayıt zaten mevcut")
			return
		}
		utils.JSONError(c, http.StatusInternalServerError, "Bir şeyler ters gitti")
	}
}
