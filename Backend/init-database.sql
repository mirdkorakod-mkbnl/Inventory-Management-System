-- ==========================================
-- PostgreSQL 17 Database Initialization Script
-- สำหรับ Inventory Management System
-- ==========================================

-- 1. สร้าง Database (ถ้ายังไม่มี)
-- หมายเหตุ: รันคำสั่งนี้ก่อนดำเนินการต่อ
-- CREATE DATABASE inventory_db;

-- 2. สร้าง Schema และ Extensions
CREATE SCHEMA IF NOT EXISTS public;

-- 3. สร้าง Type enum สำหรับ Role
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. ตารางผู้ใช้ (Users)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password BYTEA NOT NULL,
    role user_role DEFAULT 'user'::user_role,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 5. ตารางสินค้า (Products)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT fk_products_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. สร้าง Index เพื่อเร่งการค้นหา
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);

-- 7. สร้าง Function อัปเดต updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. สร้าง Trigger สำหรับ users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. สร้าง Trigger สำหรับ products table
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. ข้อมูลตัวอย่าง (Admin User)
-- ⚠️ Password: admin123 (แฮชด้วย bcrypt cost 14)
INSERT INTO users (name, email, password, role)
VALUES (
    'Admin User',
    'admin@example.com',
    convert_to('$2a$14$uLCSMAfrkLAnlpV99zVCH.tR7WvU4G7bbXGMNv.BX8XFgXwkctyCC', 'UTF8'),
    'admin'::user_role
)
ON CONFLICT (email) DO NOTHING;

-- 11. ข้อมูลตัวอย่าง (Regular User)
-- ⚠️ Password: user123
INSERT INTO users (name, email, password, role)
VALUES (
    'Regular User',
    'user@example.com',
    convert_to('$2a$14$jjM2iHLIFpP8RPkWcdHoeu8aFxQ.pW5ZWXYRk3ZeOWe6D3g6FIOxK', 'UTF8'),
    'user'::user_role
)
ON CONFLICT (email) DO NOTHING;

-- 12. ข้อมูลตัวอย่างสินค้า
INSERT INTO products (name, code, price, stock, user_id)
SELECT 
    'Sample Product',
    'PRD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-001',
    99.99,
    10,
    id
FROM users WHERE email = 'user@example.com'
ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- การตรวจสอบข้อมูล
-- ==========================================
-- SELECT * FROM users;
-- SELECT * FROM products;
