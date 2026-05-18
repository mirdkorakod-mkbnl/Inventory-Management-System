package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func IsAuthenticated(c *fiber.Ctx) error {
	// 1. พยายามดึง Token จาก Cookie ก่อน
	cookie := c.Cookies("jwt")

    // 2. ถ้าไม่มีใน Cookie ให้ลองดูใน Header (Authorization: Bearer <token>)
    // (อันนี้แหละที่ Postman จะใช้)
    tokenString := cookie
    if tokenString == "" {
        authHeader := c.Get("Authorization")
        if len(authHeader) > 7 && strings.ToUpper(authHeader[:7]) == "BEARER " {
            tokenString = authHeader[7:]
        }
    }

	if tokenString == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "Unauthenticated",
		})
	}

	// 3. ตรวจสอบความถูกต้องของ Token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET_KEY")), nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "Unauthenticated",
		})
	}

    // 4. ดึง User ID ออกมาเก็บไว้ใช้ต่อ
    claims := token.Claims.(jwt.MapClaims)
    c.Locals("user_id", claims["sub"]) // เก็บ ID ไว้ใน Locals

	return c.Next() // ผ่าน! ไปทำงานต่อได้
}