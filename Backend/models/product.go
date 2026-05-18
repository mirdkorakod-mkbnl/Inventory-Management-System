package models

import "gorm.io/gorm"

type Product struct {
	gorm.Model
	Name   string  `json:"name"`
    
	Code   string  `json:"code" gorm:"type:varchar(100);unique;not null"`
	Price  float64 `json:"price"`
	Stock  int     `json:"stock"`
	// Status string  `json:"status"`
	//ผูกกับ User ID
	UserID uint    `json:"user_id"`

	// เพิ่มบรรทัดนี้: เพื่อให้ GORM รู้ว่าสินค้านี้เชื่อมกับ User คนไหน
	User   User    `json:"user" gorm:"foreignKey:UserID"`
}