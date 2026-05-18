package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() {
	var err error

	// ✅ 2. เพิ่มส่วนโหลดไฟล์ .env ตรงนี้
	// มันจะอ่านไฟล์ .env แล้วยัดค่าลงใน os.Getenv ให้เอง
	err = godotenv.Load()
	if err != nil {
		// ถ้าหาไฟล์ไม่เจอ (เช่นรันบน Docker Production) ให้แจ้งเตือนเฉยๆ ไม่ต้อง Error
		log.Println("Note: .env file not found. Using system environment variables.")
	}

	// สร้าง DSN สำหรับ PostgreSQL
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_SSLMODE"),
	)

	// Retry Logic
	for i := 0; i < 30; i++ {
		DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})

		if err == nil {
			log.Println("Connected to PostgreSQL successfully!")
			break
		}

		log.Printf("Failed to connect to PostgreSQL: %v", err)
		log.Println("PostgreSQL not yet ready...")
		log.Println("Backing off for two seconds...")
		time.Sleep(2 * time.Second)
	}

	if err != nil {
		log.Fatal("Could not connect to the database after retries")
	}

	log.Println("running migrations")
	// DB.AutoMigrate(&models.Product{})
}
