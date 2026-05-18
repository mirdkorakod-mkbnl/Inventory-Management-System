package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/inventory-backend/database"
	"github.com/inventory-backend/models"
)

// AdminGetAllProducts ดูสินค้าทั้งหมด + ข้อมูลเจ้าของ
func AdminGetAllProducts(c *fiber.Ctx) error {
	var products []models.Product
	
	// Preload("User") คือสั่งให้ไปดึงข้อมูลจากตาราง User มาแปะด้วย
	database.DB.Preload("User").Find(&products)
	
	return c.JSON(products)
}

// AdminUpdateProduct แก้ไขสินค้าของใครก็ได้
func AdminUpdateProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	var product models.Product

	// Admin ไม่ต้องเช็ค user_id แก้ได้หมด
	if result := database.DB.First(&product, id); result.Error != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Product not found"})
	}

	if err := c.BodyParser(&product); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	database.DB.Save(&product)
	return c.JSON(product)
}

// AdminDeleteProduct ลบสินค้าของใครก็ได้
func AdminDeleteProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	var product models.Product

	// Admin ลบได้หมด ไม่ต้องเช็ค owner
	if result := database.DB.First(&product, id); result.Error != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Product not found"})
	}

	database.DB.Delete(&product)
	return c.JSON(fiber.Map{"message": "Product deleted by Admin"})
}