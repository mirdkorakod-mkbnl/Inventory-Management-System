package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/inventory-backend/database"
	"github.com/inventory-backend/models"
)

// IsAdmin: ต้องผ่าน IsAuthenticated มาก่อนนะ ถึงจะมาใช้อันนี้ได้
func IsAdmin(c *fiber.Ctx) error {
	// 1. ดึง UserID ที่ IsAuthenticated ฝากไว้
	userID := c.Locals("user_id")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"message": "Unauthorized"})
	}

	// 2. เช็คใน Database ว่า User คนนี้เป็น admin ไหม
	var user models.User
	database.DB.First(&user, userID)

	if user.Role != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"message": "Access Denied: You are not an Admin",
		})
	}

	// 3. ถ้าใช่ ก็ผ่านไป
	return c.Next()
}