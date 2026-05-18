// handlers/product.go
package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/inventory-backend/database"
	"github.com/inventory-backend/models"
	"github.com/inventory-backend/utils"
)

// --- [เพิ่ม] Helper Function ช่วยดึง User ID จาก Context ---
func getUserID(c *fiber.Ctx) uint {
	// ดึงค่า user_id ที่ Middleware ฝากไว้ (ต้องแปลงเป็น string ก่อน แล้วค่อยเป็น int)
	idVal := c.Locals("user_id")
	if idVal == nil {
		return 0
	}
	idStr := idVal.(string)
	id, _ := strconv.Atoi(idStr)
	return uint(id)
}

// -------------------------------------------------------

// CreateProduct godoc
// @Summary      เพิ่มสินค้าใหม่
// @Description  สร้างสินค้าโดยส่ง JSON เข้ามา (ระบบจะผูกกับ User ที่ Login อัตโนมัติ)
// @Tags         Products
// @Accept       json
// @Produce      json
// @Param product body models.Product true "ข้อมูลสินค้า"
// @Success      200  {object}  models.Product
// @Router       /api/products [post]
func CreateProduct(c *fiber.Ctx) error {
	userID := getUserID(c)

	// ✅ 1. รับเฉพาะ field ที่ user กรอกได้
	var input struct {
		Name  string  `json:"name"`
		Price float64 `json:"price"`
		Stock int     `json:"stock"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// ✅ 2. ตรวจสอบค่าความสมบูรณ์ของข้อมูล
	if input.Price < 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Price cannot be negative"})
	}
	if input.Stock < 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Stock cannot be negative"})
	}
	if input.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Product name is required"})
	}

	// ✅ 3. Backend สร้าง Product เอง
	product := models.Product{
		Name:   input.Name,
		Price:  input.Price,
		Stock:  input.Stock,
		Code:   utils.GenerateProductCode(), // ⭐ สุ่มตรงนี้
		UserID: userID,
	}

	if err := database.DB.Create(&product).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(200).JSON(product)
}

// GetProducts godoc
// @Summary      ดูสินค้า (Admin เห็นทั้งหมด / User เห็นแค่ของตัวเอง)
// @Description  ดึงรายการสินค้า ถ้าเป็น Admin จะเห็นของทุกคน ถ้าเป็น User จะเห็นแค่ของตัวเอง
// @Tags         Products
// @Produce      json
// @Success      200  {array}  models.Product
// @Router       /api/products [get]
func GetProducts(c *fiber.Ctx) error {
	userID := getUserID(c) // 1. ดึง ID คนที่ Login

	// 2. ค้นหาข้อมูล User ใน Database เพื่อเช็ค Role
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}

	var products []models.Product

	// 3. ตรวจสอบสิทธิ์ (Logic สำคัญ)
	// ถ้า Role เป็น "admin" เท่านั้น
	if user.Role == "admin" {
		// 👑 ADMIN: ดึงทั้งหมด + ดึงข้อมูลเจ้าของ (User) มาโชว์ด้วย
		database.DB.Preload("User").Find(&products)
	} else {
		// 👤 USER: ดึงเฉพาะของตัวเอง
		database.DB.Preload("User").Where("user_id = ?", userID).Find(&products)
	}

	return c.Status(200).JSON(products)
}

// UpdateProduct godoc
// @Summary แก้ไขสินค้า
// @Description Update product details by ID (ต้องเป็นเจ้าของเท่านั้น)
// @Tags Products
// @Accept json
// @Produce json
// @Param id path int true "Product ID"
// @Param product body models.Product true "Product Data"
// @Success 200 {object} models.Product
// @Router /api/products/{id} [put]
func UpdateProduct(c *fiber.Ctx) error {
	userID := getUserID(c)
	id := c.Params("id")

	var product models.Product
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&product).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Product not found or access denied",
		})
	}

	// ✅ รับเฉพาะ field ที่แก้ได้
	var input struct {
		Name  string  `json:"name"`
		Price float64 `json:"price"`
		Stock int     `json:"stock"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	// ตรวจสอบค่าความสมบูรณ์
	if input.Price < 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Price cannot be negative"})
	}
	if input.Stock < 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Stock cannot be negative"})
	}
	if input.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Product name is required"})
	}

	product.Name = input.Name
	product.Price = input.Price
	product.Stock = input.Stock
	product.UserID = userID // safety

	database.DB.Save(&product)
	return c.JSON(product)
}

// DeleteProduct godoc
// @Summary      ลบสินค้า (Admin Only)
// @Description  ลบสินค้าตาม ID (เฉพาะ Admin เท่านั้นที่ลบได้ ลบได้ทุกชิ้นไม่ว่าของใคร)
// @Tags         Products
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "Product ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      403  {object}  map[string]interface{}
// @Failure      404  {object}  map[string]interface{}
// @Router       /api/products/{id} [delete]
func DeleteProduct(c *fiber.Ctx) error {
	userID := getUserID(c) // 1. ดึง ID คนที่ Login
	id := c.Params("id")

	// 2. ดึงข้อมูล User เพื่อเช็ค Role
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not found"})
	}

	// 3. 🔒 ตรวจสอบสิทธิ์: ต้องเป็น Admin เท่านั้น
	isAdmin := user.Role == "admin"

	if !isAdmin {
		// ❌ ถ้าไม่ใช่ Admin ห้ามลบเด็ดขาด
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Access denied: Only Admin can delete products",
		})
	}

	// 4. ✅ เป็น Admin: ค้นหาสินค้า (หาจากทั้งหมด ไม่ต้องเช็ค user_id)
	var product models.Product
	if result := database.DB.First(&product, id); result.Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Product not found",
		})
	}

	// 5. สั่งลบ
	database.DB.Delete(&product)

	return c.JSON(fiber.Map{
		"message": "Product deleted successfully (Admin action)",
	})
}
