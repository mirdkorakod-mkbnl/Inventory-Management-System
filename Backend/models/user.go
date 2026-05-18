package models

import (
	"time"
)

type User struct {

	ID       uint   `gorm:"primaryKey" json:"id"`
	Name     string `json:"name"`
	Email    string `gorm:"unique" json:"email"` // gorm:"unique" ห้ามอีเมลซ้ำ
	Password []byte `json:"-"`                   // json:"-" คือซ่อนไม่ให้ส่งรหัสผ่านกลับไปให้หน้าเว็บ
	// เพิ่ม Role: default เป็น 'user'
	Role     string `json:"role" gorm:"default:'user'"`

	ResetToken       string    `json:"-"` 
	ResetTokenExpiry *time.Time `json:"-"`
}