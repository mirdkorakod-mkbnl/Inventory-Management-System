package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/gomail.v2"

	"github.com/inventory-backend/database"
	"github.com/inventory-backend/models"
)

// ดึง SecretKey จาก .env
func getSecretKey() string {
    key := os.Getenv("JWT_SECRET_KEY")
    if key == "" {
        key = "secret" // fallback สำหรับ development
    }
    return key
}

// --- Structs สำหรับ Swagger (DTOs) ---
// เราสร้างไว้เพื่อให้ Swagger รู้ว่าต้องส่งค่าอะไรมาบ้าง (เพราะ models.User ซ่อน password ไว้)

type RegisterInput struct {
	Name     string `json:"name" example:"John Doe"`
	Email    string `json:"email" example:"john@example.com"`
	Password string `json:"password" example:"123456"`
}

type LoginInput struct {
	Email    string `json:"email" example:"admin@"`
	Password string `json:"password" example:"123456"`
}

// 1. ประกาศ Struct สำหรับรับค่า (Request Models) ไว้ด้านนอกฟังก์ชัน
type ForgotPasswordInput struct {
    Email string `json:"email" example:"user@example.com"`
}

type ResetPasswordInput struct {
    Token           string `json:"token" example:"generated-token-xyz"`
    NewPassword     string `json:"new_password" example:"newpassword123"`
    ConfirmPassword string `json:"confirm_password" example:"newpassword123"`
}

// Register godoc
// @Summary      Register a new user
// @Description  สมัครสมาชิกใหม่
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        input body RegisterInput true "ข้อมูลสมัครสมาชิก"
// @Success      200  {object}  models.User
// @Failure      400  {object}  map[string]string
// @Router       /api/register [post]
func Register(c *fiber.Ctx) error {
	var input RegisterInput

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	if input.Email == "" || input.Password == "" || input.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "All fields are required"})
	}

	password, _ := bcrypt.GenerateFromPassword([]byte(input.Password), 14)

	user := models.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: password,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{
			"message": "Could not create user (Email might be taken)",
		})
	}

	return c.JSON(user)
}


// Login godoc
// @Summary      Login user
// @Description  เข้าสู่ระบบ (จะได้รับ Cookie 'jwt')
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        input body LoginInput true "ข้อมูลเข้าสู่ระบบ"
// @Success      200  {object}  map[string]string
// @Failure      400  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Router       /api/login [post]
func Login(c *fiber.Ctx) error {
	var data map[string]string

	if err := c.BodyParser(&data); err != nil {
		return err
	}

	var user models.User
	// ค้นหา User ด้วย Email
	database.DB.Where("email = ?", data["email"]).First(&user)

	if user.ID == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"message": "User not found",
		})
	}

	// เช็ค Password
	if err := bcrypt.CompareHashAndPassword(user.Password, []byte(data["password"])); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Incorrect password",
		})
	}

	// สร้าง JWT Token
	claims := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  strconv.Itoa(int(user.ID)),
		"role": user.Role,                            //
		"exp":  time.Now().Add(time.Hour * 24).Unix(), // หมดอายุใน 24 ชม.
	})

	token, err := claims.SignedString([]byte(getSecretKey()))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Could not login",
		})
	}

	// ส่ง Token กลับทาง Cookie
	cookie := fiber.Cookie{
		Name:     "jwt",
		Value:    token,
		Expires:  time.Now().Add(time.Hour * 24),
		HTTPOnly: true,
	}
	c.Cookie(&cookie)

	// ✅✅✅ แก้ไขตรงนี้ครับ: ส่ง User Info และ Role กลับไปให้ Frontend ด้วย ✅✅✅
	return c.JSON(fiber.Map{
		"message": "success",
		"token":   token,
		"user": fiber.Map{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role, // 👈 Frontend จะเอาค่านี้ไปใช้เช็ค Admin/User
		},
	})
}

// Logout godoc
// @Summary      Logout user
// @Description  ออกจากระบบ (ลบ Cookie)
// @Tags         Auth
// @Produce      json
// @Success      200  {object}  map[string]string
// @Router       /api/logout [post]
func Logout(c *fiber.Ctx) error {
	cookie := fiber.Cookie{
		Name:     "jwt",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour),
		HTTPOnly: true,
	}

	c.Cookie(&cookie)

	return c.JSON(fiber.Map{
		"message": "success",
	})
}



// ==========================================
// 🚀 ส่วนที่เพิ่มใหม่: Forgot Password Logic
// ==========================================

// ⚠️ 1. คุณขาดฟังก์ชันนี้ครับ (ต้องแปะเพิ่มลงไป)
// --- Helper: สร้าง Random Token ---
func generateToken() (string, error) {
    bytes := make([]byte, 32)
    if _, err := rand.Read(bytes); err != nil {
        return "", err
    }
    return hex.EncodeToString(bytes), nil
}

// --- Helper: ส่งอีเมล (ดึงจาก env) ---
func sendResetEmail(to string, token string) error {
    senderEmail := os.Getenv("SMTP_EMAIL")
    senderPassword := os.Getenv("SMTP_PASSWORD")
    smtpHost := os.Getenv("SMTP_HOST")
    smtpPort := 587 
    frontendURL := os.Getenv("FRONTEND_URL")

    m := gomail.NewMessage()
    m.SetHeader("From", senderEmail)
    m.SetHeader("To", to)
    m.SetHeader("Subject", "Reset Password Request")

    resetLink := fmt.Sprintf("%s/reset-password?token=%s", frontendURL, token)
    
    body := fmt.Sprintf(`
        <h3>Password Reset Request</h3>
        <p>Click the link below to reset your password:</p>
        <p><a href="%s">Reset Password</a></p>
        <p>If you didn't request this, please ignore this email.</p>
    `, resetLink)

    m.SetBody("text/html", body)

    d := gomail.NewDialer(smtpHost, smtpPort, senderEmail, senderPassword)
    return d.DialAndSend(m)
}

// ForgotPassword godoc
// @Summary      ขอรีเซ็ตรหัสผ่าน
// @Description  ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมล
// @Tags         Forgot Password
// @Accept       json
// @Produce      json
// @Param        input body ForgotPasswordInput true "Email"
// @Success      200  {object}  map[string]string
// @Router       /api/forgot-password [post]
func ForgotPassword(c *fiber.Ctx) error {
    var input ForgotPasswordInput
    if err := c.BodyParser(&input); err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
    }

    var user models.User
    if err := database.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
        return c.JSON(fiber.Map{"message": "If email exists, reset link sent."})
    }

    token, _ := generateToken() 
    user.ResetToken = token
    expiry := time.Now().Add(time.Hour * 1)
	user.ResetTokenExpiry = &expiry

    // บันทึกข้อมูล token เข้า database
    if err := database.DB.Save(&user).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Failed to save reset token"})
    }

    // ส่งอีเมลพร้อมจัดการข้อผิดพลาด
    go func() {
        if err := sendResetEmail(user.Email, token); err != nil {
            log.Printf("Failed to send reset email to %s: %v", user.Email, err)
        }
    }()

    return c.JSON(fiber.Map{"message": "Reset link sent to your email"})
}

// ResetPassword godoc
// @Summary      ตั้งรหัสผ่านใหม่
// @Description  ใช้ Token เพื่อตั้งรหัสผ่านใหม่
// @Tags         Forgot Password
// @Accept       json
// @Produce      json
// @Param        input body ResetPasswordInput true "Token and New Password"
// @Success      200  {object}  map[string]string
// @Router       /api/reset-password [post]
func ResetPassword(c *fiber.Ctx) error {
    var input ResetPasswordInput
    if err := c.BodyParser(&input); err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
    }

    if input.NewPassword != input.ConfirmPassword {
        return c.Status(400).JSON(fiber.Map{"error": "Passwords do not match"})
    }

    var user models.User
    // ใช้ COALESCE เพื่อจัดการ NULL value
    if err := database.DB.Where("reset_token = ? AND COALESCE(reset_token_expiry, '1970-01-01') > ?", input.Token, time.Now()).First(&user).Error; err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "Invalid or expired token"})
    }

    // Hash Password
    hash, _ := bcrypt.GenerateFromPassword([]byte(input.NewPassword), 14)
    
    user.Password = hash
	user.ResetToken = ""
	user.ResetTokenExpiry = nil

	database.DB.Save(&user)

    return c.JSON(fiber.Map{"message": "Password reset successfully"})
}