package handlers

import (
    "github.com/gofiber/fiber/v2"
    "github.com/inventory-backend/database"
    "github.com/inventory-backend/models"
)

// GetUsers godoc
// @Summary      ดึงรายชื่อ User ทั้งหมด (Admin Only)
// @Description  ดูรายชื่อผู้ใช้งานทั้งหมดในระบบ
// @Tags         admin
// @Produce      json
// @Success      200  {array}  models.User
// @Router       /api/admin/users [get]
func GetUsers(c *fiber.Ctx) error {
    var users []models.User
    
    // ดึงข้อมูลทั้งหมด
    if err := database.DB.Find(&users).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{"error": err.Error()})
    }

    // ลบ Password ออกก่อนส่งกลับ เพื่อความปลอดภัย
    for i := range users {
       users[i].Password = []byte("")
    }

    return c.JSON(users)
}