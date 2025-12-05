# File Management Backend

Backend API cho hệ thống quản lý file với NestJS, MongoDB, và FTP server.

## Cài đặt

```bash
yarn install
```

## Cấu hình

Copy file `env.example` thành `.env` và điền thông tin:

```env
MONGODB_URI=mongodb://localhost:27017/file-management
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
FTP_HOST=localhost
FTP_PORT=21
FTP_USER=ftpuser
FTP_PASSWORD=ftppassword
FTP_SECURE=false
PORT=3000
```

## Chạy ứng dụng

```bash
# Development
yarn start:dev

# Production
yarn build
yarn start:prod
```

## API Endpoints

### Authentication
- `POST /auth/login` - Đăng nhập

### Users (Admin only)
- `GET /users` - Lấy danh sách users
- `POST /users` - Tạo user mới
- `GET /users/:id` - Lấy thông tin user
- `PATCH /users/:id` - Cập nhật user
- `DELETE /users/:id` - Xóa user
- `POST /users/:id/reset-password` - Reset password
- `PATCH /users/:id/role` - Cập nhật role

### Projects
- `GET /projects` - Lấy danh sách projects
- `POST /projects` - Tạo project mới
- `GET /projects/:id` - Lấy thông tin project
- `POST /projects/:id/members` - Thêm member vào project
- `DELETE /projects/:id/members/:memberId` - Xóa member khỏi project

### Files
- `POST /files/upload/:projectId` - Upload file
- `GET /files/project/:projectId` - Lấy danh sách files trong project
- `GET /files/:id` - Lấy thông tin file
- `GET /files/:id/download` - Download file
- `PUT /files/:id` - Cập nhật file
- `DELETE /files/:id` - Xóa file
- `GET /files/:id/history` - Lấy lịch sử file

