package main

import (
	"log"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/swagger"
	"github.com/inventory-backend/database"
	_ "github.com/inventory-backend/docs"
	"github.com/inventory-backend/handlers"
	"github.com/inventory-backend/middleware"
	"github.com/inventory-backend/models"
	"github.com/joho/godotenv"
)

// @title           Inventory API
// @version         1.0
// @description     ระบบจัดการสต็อกสินค้า
// @host            localhost:8080
// @BasePath        /
func main() {
	// โหลด .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("Note: .env file not found")
	}

	database.InitDB()

	// Auto Migration (ต้องมี Role ใน User และ UserID ใน Product)
	err = database.DB.AutoMigrate(&models.Product{}, &models.User{})
	if err != nil {
		panic("Failed to migrate database: " + err.Error())
	}

	app := fiber.New()

	// CORS Setup - ดึงจาก .env หรือใช้ default
	allowOriginsStr := os.Getenv("CORS_ALLOW_ORIGINS")
	if allowOriginsStr == "" {
		allowOriginsStr = "http://localhost:3000"
	}
	// Split comma-separated origins
	allowOrigins := strings.Split(strings.TrimSpace(allowOriginsStr), ",")
	for i := range allowOrigins {
		allowOrigins[i] = strings.TrimSpace(allowOrigins[i])
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Join(allowOrigins, ", "),
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	// Rate Limiting - จำกัดการร้องขอให้ 100 ครั้งต่อ 15 นาที
	app.Use(limiter.New(limiter.Config{
		Max:        100,
		Expiration: 15 * time.Minute,
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Too many requests, please try again later",
			})
		},
	}))

	app.Get("/swagger/*", swagger.HandlerDefault)

	// ================================
	// 1. โซน Public (ใครก็เข้าได้)
	// ================================
	app.Post("/api/register", handlers.Register)
	app.Post("/api/login", handlers.Login)
	app.Post("/api/logout", handlers.Logout)

	app.Post("/api/forgot-password", handlers.ForgotPassword)
	app.Post("/api/reset-password", handlers.ResetPassword)

	// ================================
	// 2. โซน User (ต้องล็อกอิน)
	// ================================
	// สร้าง Group สำหรับ /api/products
	productGroup := app.Group("/api/products")

	// [สำคัญ!] ใส่ Middleware ดักไว้หน้าประตู Group นี้
	// ใครไม่มี Token จะถูกดีดออกไปทันที
	productGroup.Use(middleware.IsAuthenticated) // เช็ค Token

	// Route สินค้า (ใช้ path "/" เพราะ group กำหนด prefix ไว้แล้ว)
	productGroup.Get("/", handlers.GetProducts)      // ดูของตัวเอง
	productGroup.Post("/", handlers.CreateProduct)   // เพิ่มของตัวเอง
	productGroup.Put("/:id", handlers.UpdateProduct) // แก้ของตัวเอง

	// ✅ เพิ่ม Import สำหรับ User
	productGroup.Post("/import", handlers.ImportProductsForUser)

	// Export (Admin + User)
	productGroup.Get("/export", handlers.ExportProducts)

	productGroup.Post("/import/preview", handlers.PreviewImportProducts)
	productGroup.Get("/import/template", handlers.DownloadProductTemplate)

	// ================================
	// 3. โซน Admin (Super Private)
	// ================================
	// Group สำหรับการจัดการสินค้าแบบ Admin
	adminGroup := app.Group("/api/admin")
	// ต้องผ่าน 2 ด่าน: มี Token ไหม? -> เป็น Admin ไหม?
	adminGroup.Use(middleware.IsAuthenticated, middleware.IsAdmin)

	adminGroup.Get("/products", handlers.AdminGetAllProducts)       // ดูทั้งหมด + เจ้าของ
	adminGroup.Put("/products/:id", handlers.AdminUpdateProduct)    // แก้สินค้าใครก็ได้
	adminGroup.Delete("/products/:id", handlers.AdminDeleteProduct) // ลบสินค้าใครก็ได้

	// สำหรับดู Users ทั้งหมด (เฉพาะ Admin ถึงควรเห็น)
	adminGroup.Get("/users", handlers.GetUsers)

	// Import (Admin only)
	adminGroup.Post("/products/import", handlers.ImportProducts)

	adminGroup.Post("/products/import/preview", handlers.PreviewImportProducts)
	adminGroup.Get("/products/import/template", handlers.DownloadProductTemplate)

	app.Listen(":8080")
}
