# Docker Setup Guide

Hướng dẫn sử dụng Docker để chạy ứng dụng File Management.

## Yêu cầu

- Docker Engine 20.10+
- Docker Compose 2.0+

## Cấu trúc

- `docker-compose.yml`: Cấu hình cho môi trường production
- `docker-compose.dev.yml`: Cấu hình cho môi trường development
- `backend/Dockerfile`: Dockerfile cho backend (production)
- `backend/Dockerfile.dev`: Dockerfile cho backend (development)
- `frontend/Dockerfile`: Dockerfile cho frontend (production)
- `frontend/Dockerfile.dev`: Dockerfile cho frontend (development)

## Production Mode

### 1. Tạo file `.env` (tùy chọn)

Tạo file `.env` ở thư mục gốc với các biến môi trường:

```env
JWT_SECRET=your-secret-key-change-in-production
FTP_HOST=127.0.0.1
FTP_PORT=12704
FTP_USER=ftpuser
FTP_PASSWORD=123456
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_FULL_NAME=Admin User
```

### 2. Build và chạy

```bash
# Build và chạy tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down

# Dừng và xóa volumes (xóa dữ liệu MongoDB)
docker-compose down -v
```

### 3. Truy cập ứng dụng

- Frontend: http://localhost
- Backend API: http://localhost/api
- MongoDB: localhost:27017

## Development Mode

### 1. Chạy development mode

```bash
# Build và chạy với hot reload
docker-compose -f docker-compose.dev.yml up -d

# Xem logs
docker-compose -f docker-compose.dev.yml logs -f

# Dừng services
docker-compose -f docker-compose.dev.yml down
```

### 2. Truy cập ứng dụng

- Frontend: http://localhost:3002
- Backend API: http://localhost:3000
- MongoDB: localhost:27017

## Các lệnh hữu ích

### Xem logs

```bash
# Tất cả services
docker-compose logs -f

# Chỉ backend
docker-compose logs -f backend

# Chỉ frontend
docker-compose logs -f frontend

# Chỉ MongoDB
docker-compose logs -f mongodb
```

### Rebuild images

```bash
# Rebuild tất cả
docker-compose build --no-cache

# Rebuild một service cụ thể
docker-compose build --no-cache backend
```

### Vào container

```bash
# Vào backend container
docker-compose exec backend sh

# Vào frontend container
docker-compose exec frontend sh

# Vào MongoDB container
docker-compose exec mongodb mongosh
```

### Xóa tất cả

```bash
# Dừng và xóa containers, networks, volumes
docker-compose down -v

# Xóa images
docker-compose down --rmi all
```

## Troubleshooting

### Port đã được sử dụng

Nếu port đã được sử dụng, thay đổi port trong `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Thay đổi 3000 thành 3001
```

### MongoDB connection error

Đảm bảo MongoDB container đã khởi động:

```bash
docker-compose ps
```

Nếu MongoDB chưa sẵn sàng, đợi vài giây rồi thử lại.

### Build error

Xóa cache và rebuild:

```bash
docker-compose build --no-cache
```

### Volume permissions

Nếu gặp lỗi permission với volumes, thêm user vào docker group:

```bash
sudo usermod -aG docker $USER
```

Sau đó logout và login lại.

## Production Deployment

### 1. Tối ưu hóa images

```bash
# Build với multi-stage để giảm kích thước
docker-compose build
```

### 2. Sử dụng environment variables

Tạo file `.env.production` và sử dụng:

```bash
docker-compose --env-file .env.production up -d
```

### 3. Sử dụng reverse proxy (Nginx/Traefik)

Có thể thêm reverse proxy vào `docker-compose.yml` để xử lý SSL và routing.

## Notes

- MongoDB data được lưu trong Docker volume `mongodb_data`
- Backend temp files được mount từ `./backend/temp`
- Trong development mode, source code được mount để hỗ trợ hot reload
- Frontend sử dụng Nginx để serve static files và proxy API requests

