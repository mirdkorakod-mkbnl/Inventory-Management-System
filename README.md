# 📦 Inventory Management System

ระบบจัดการสต็อกสินค้า (Inventory Management System) ที่สร้างด้วย **Go + PostgreSQL** สำหรับ Backend และ **Next.js + React** สำหรับ Frontend

## ✨ Features

### Backend (Go + Fiber)
- ✅ **RESTful API** - Swagger documentation
- ✅ **Authentication** - JWT token (24-hour expiry)
- ✅ **Authorization** - Role-based access control (Admin/User)
- ✅ **Product Management** - CRUD operations
- ✅ **CSV Export/Import** - ดึงข้อมูลและนำเข้า products
- ✅ **Password Reset** - Email support (Gmail SMTP)
- ✅ **Rate Limiting** - 100 requests/15 minutes
- ✅ **CORS** - Configurable origins

### Frontend (Next.js)
- ✅ **User Authentication** - Login/Register/Forgot Password
- ✅ **Product Dashboard** - View products with charts
- ✅ **Admin Panel** - Manage all users' products
- ✅ **Product Operations** - Create/Edit/Delete/Export
- ✅ **Responsive Design** - Mobile-friendly UI
- ✅ **Charts** - Visualize inventory by stock level

## 🏗️ Architecture

```
my-inventory-app/
├── Backend/                 # Go REST API
│   ├── database/           # PostgreSQL connection
│   ├── handlers/           # API endpoints
│   ├── middleware/         # JWT auth & role check
│   ├── models/             # Data models
│   ├── utils/              # Helper functions
│   ├── main.go             # Entry point
│   ├── go.mod              # Dependencies
│   └── init-database.sql   # Schema
│
├── frontend/               # Next.js web app
│   ├── app/                # Pages & components
│   ├── lib/                # Utilities (axios)
│   ├── package.json        # Dependencies
│   └── tsconfig.json       # TypeScript config
```

## 🚀 Quick Start

### Prerequisites
- Go 1.24+
- Node.js 20+
- PostgreSQL 17+

### Backend Setup

```bash
cd Backend

# Copy .env and update database credentials
cp .env.example .env

# Install dependencies
go mod download

# Run migrations
psql -h localhost -U postgres -d inventory_db -f init-database.sql

# Start server
go run main.go
```

Server akan running di `http://localhost:8080`
API docs: `http://localhost:8080/swagger/index.html`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local

# Start dev server
npm run dev
```

App akan running di `http://localhost:3000`

## 📝 Database Schema

### Users Table
```sql
- id (PK)
- name
- email (unique)
- password (bcrypt hashed)
- role (user/admin)
- reset_token
- reset_token_expiry
- timestamps
```

### Products Table
```sql
- id (PK)
- name
- code (unique)
- price
- stock
- user_id (FK)
- timestamps
```

## 🔐 Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | Admin |
| user@example.com | user123 | User |

## 🔗 API Endpoints

### Public Routes
- `POST /api/register` - Create account
- `POST /api/login` - Login
- `POST /api/forgot-password` - Request password reset
- `POST /api/reset-password` - Reset password

### User Routes (Protected)
- `GET /api/products` - Get own products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `GET /api/products/export` - Export as CSV
- `POST /api/products/import` - Import from CSV
- `POST /api/products/import/preview` - Preview import

### Admin Routes (Protected + Admin Only)
- `GET /api/admin/products` - Get all products
- `PUT /api/admin/products/:id` - Update any product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/users` - List all users
- `POST /api/admin/products/import` - Import products

## 🛠️ Technologies Used

### Backend
- **Fiber** - Web framework
- **GORM** - ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Excelize** - Excel handling

### Frontend
- **Next.js 16** - React framework
- **Mantine** - UI components
- **Axios** - HTTP client
- **TypeScript** - Type safety
- **TailwindCSS** - Styling

## 📦 Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=inventory_db
DB_SSLMODE=disable
JWT_SECRET_KEY=your-super-secret-key
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:3001
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 🐛 Known Issues & Solutions

### Password Reset Email
- Gmail requires "App Password" (not regular password)
- Enable 2-factor authentication on Gmail account

### CORS Errors
- Check `CORS_ALLOW_ORIGINS` matches frontend URL
- Ensure `AllowMethods` includes OPTIONS for CORS preflight

### Database Connection
- Verify PostgreSQL is running: `psql --version`
- Check credentials in `.env`

## 📄 License

MIT License

## 👨‍💻 Author

Created for Internship Project - Inventory Management System
