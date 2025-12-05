# Hướng dẫn cài đặt và chạy dự án

## Yêu cầu hệ thống

- Node.js >= 18.x
- MongoDB >= 5.0
- FTP Server (có thể dùng FileZilla Server hoặc vsftpd)

## Cài đặt Backend

1. Di chuyển vào thư mục backend:
```bash
cd backend
```

2. Cài đặt dependencies:
```bash
yarn install
```

3. Tạo file `.env` từ file `env.example`:
```bash
# Windows
copy env.example .env

# Linux/Mac
cp env.example .env
```

4. Chỉnh sửa file `.env` với thông tin của bạn:
```env
MONGODB_URI=mongodb://localhost:27017/file-management
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
FTP_ENABLED=true
FTP_HOST=127.0.0.1
FTP_PORT=12704
FTP_USER=ftpuser
FTP_PASSWORD=123456
FTP_SECURE=false
FTP_ROOT_PATH=/
PORT=3000
```

5. Đảm bảo MongoDB đang chạy

6. (Tùy chọn) Cấu hình FTP Server:
   - Nếu bạn chưa có FTP server, có thể tạm thời tắt FTP bằng cách thêm `FTP_ENABLED=false` vào file `.env`
   - Khi tắt FTP, file sẽ chỉ được lưu trong database (metadata), không upload lên FTP server
   - Để sử dụng đầy đủ tính năng, bạn cần cấu hình FTP server (xem phần Cấu hình FTP Server bên dưới)

7. Chạy backend:
```bash
yarn start:dev
```

Backend sẽ chạy tại `http://localhost:3000`

**Lưu ý:** Nếu bạn thấy lỗi kết nối FTP khi khởi động, có thể:
- Tắt FTP tạm thời bằng cách thêm `FTP_ENABLED=false` vào file `.env`
- Hoặc cấu hình FTP server đúng (xem phần Cấu hình FTP Server)

## Cài đặt Frontend

1. Mở terminal mới, di chuyển vào thư mục frontend:
```bash
cd frontend
```

2. Cài đặt dependencies:
```bash
yarn install
```

3. Chạy frontend:
```bash
yarn dev
```

Frontend sẽ chạy tại `http://localhost:3001`

## Tạo user admin đầu tiên

**Tự động:** Hệ thống sẽ tự động tạo user admin mặc định khi khởi động lần đầu (nếu chưa có admin nào).

Thông tin đăng nhập mặc định:
- **Email:** `admin@example.com`
- **Password:** `admin123`
- **Full Name:** `Admin User`

Bạn có thể thay đổi thông tin này trong file `.env`:
```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_FULL_NAME=Admin User
```

**Lưu ý:** Sau khi đăng nhập lần đầu, bạn nên đổi mật khẩu ngay!

### Tạo admin thủ công (nếu cần)

Nếu bạn muốn tạo admin thủ công, có thể sử dụng script:

```bash
# Sử dụng yarn
yarn create-admin

# Hoặc sử dụng node trực tiếp
node backend/scripts/create-admin.js
```

## Cấu hình FTP Server

### FileZilla Server (Windows)

1. Cài đặt FileZilla Server
2. Tạo user với username và password như trong file `.env`
3. Cấu hình home directory cho user

### vsftpd (Linux)

1. Cài đặt vsftpd:
```bash
sudo apt-get install vsftpd
```

2. Cấu hình `/etc/vsftpd.conf`:
```
listen=YES
anonymous_enable=NO
local_enable=YES
write_enable=YES
local_umask=022
```

3. Tạo user:
```bash
sudo useradd -m ftpuser
sudo passwd ftpuser
```

4. Khởi động service:
```bash
sudo systemctl start vsftpd
sudo systemctl enable vsftpd
```

## Sử dụng

1. Truy cập `http://localhost:3001`
2. Đăng nhập với tài khoản admin mặc định:
   - **Email:** `admin@example.com`
   - **Password:** `admin123`
3. Nếu là admin, bạn sẽ được chuyển đến trang quản lý users
4. Nếu là user, bạn sẽ được chuyển đến trang quản lý projects
5. **Quan trọng:** Sau khi đăng nhập, hãy đổi mật khẩu admin ngay!

## Lưu ý

- Đảm bảo MongoDB đang chạy trước khi start backend
- FTP server là tùy chọn: bạn có thể tắt bằng cách thêm `FTP_ENABLED=false` vào `.env` nếu chưa cấu hình
- Nếu bật FTP, đảm bảo FTP server đang chạy và cấu hình đúng trong file `.env`
- Thư mục `temp` sẽ được tạo tự động trong backend để lưu file tạm
- File sẽ được lưu trên FTP server theo cấu trúc: `projects/{projectId}/{fileName}` (nếu FTP được bật)
- Nếu FTP bị tắt, metadata file vẫn được lưu trong database nhưng file thực tế không được upload lên FTP server

