package handlers

import (
	"encoding/csv"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/inventory-backend/database"
	"github.com/inventory-backend/models"
)

// @Summary Export products
// @Tags Products Import/Export
// @Security BearerAuth
// @Produce text/csv
// @Success 200 {string} file
// @Router /api/products/export [get]
func ExportProducts(c *fiber.Ctx) error {
	userID := getUserID(c)

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	var products []models.Product

	// 👑 Admin → export ทั้งหมด
	if user.Role == "admin" {
		database.DB.Preload("User").Find(&products)
	} else {
		// 👤 User → export เฉพาะของตัวเอง
		database.DB.
			Preload("User").
			Where("user_id = ?", userID).
			Find(&products)
	}

	c.Set("Content-Type", "text/csv")
	c.Set("Content-Disposition", "attachment; filename=products.csv")

	writer := csv.NewWriter(c)
	defer writer.Flush()

	// Header
	header := []string{"ID", "name", "code", "price", "stock"}
	// Admin เท่านั้นที่ได้ owner_email
	if user.Role == "admin" {
		header = append(header, "owner_email")
	}
	writer.Write(header)

	for _, p := range products {
		row := []string{
			strconv.Itoa(int(p.ID)),
			p.Name,
			p.Code,
			strconv.FormatFloat(p.Price, 'f', -1, 64),
			strconv.Itoa(p.Stock),
		}

		if user.Role == "admin" {
			row = append(row, p.User.Email)
		}

		writer.Write(row)
	}

	return nil
}
