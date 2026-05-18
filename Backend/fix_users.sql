-- Fix users password
DELETE FROM products WHERE user_id IN (SELECT id FROM users WHERE email IN ('admin@example.com', 'user@example.com'));
DELETE FROM users WHERE email IN ('admin@example.com', 'user@example.com');

-- Insert users with correct bcrypt password
-- admin123: $2a$14$uLCSMAfrkLAnlpV99zVCH.tR7WvU4G7bbXGMNv.BX8XFgXwkctyCC
-- user123: $2a$14$jjM2iHLIFpP8RPkWcdHoeu8aFxQ.pW5ZWXYRk3ZeOWe6D3g6FIOxK
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@example.com', '$2a$14$uLCSMAfrkLAnlpV99zVCH.tR7WvU4G7bbXGMNv.BX8XFgXwkctyCC'::bytea, 'admin'::user_role),
('Regular User', 'user@example.com', '$2a$14$jjM2iHLIFpP8RPkWcdHoeu8aFxQ.pW5ZWXYRk3ZeOWe6D3g6FIOxK'::bytea, 'user'::user_role);

INSERT INTO products (name, code, price, stock, user_id) VALUES
('Sample Product', 'PRD-001', 99.99, 10, (SELECT id FROM users WHERE email = 'user@example.com'));

-- Verify
SELECT email, password::text FROM users WHERE email IN ('admin@example.com', 'user@example.com');
