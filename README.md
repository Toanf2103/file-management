# File Management System

Hệ thống quản lý file với phân quyền và quản lý dự án.

## Công nghệ sử dụng

### Backend
- NestJS
- MongoDB
- JWT Authentication
- FTP Server (file storage)

### Frontend
- React + TypeScript
- Ant Design
- React Router

## Cài đặt

### Backend

```bash
cd backend
yarn install
```

Tạo file `.env` trong thư mục `backend`:

```env
MONGODB_URI=mongodb://localhost:27017/file-management
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
FTP_HOST=localhost
FTP_PORT=21
FTP_USER=ftpuser
FTP_PASSWORD=ftppassword
FTP_SECURE=false
PORT=3000
```

Chạy backend:

```bash
yarn start:dev
```

### Frontend

```bash
cd frontend
yarn install
```

Chạy frontend:

```bash
yarn dev
```

## Tính năng

### Admin
- Quản lý users (thêm, sửa, xóa)
- Phân quyền users
- Reset password

### User
- Tạo dự án
- Thêm thành viên vào dự án
- Upload/download files
- Quản lý files trong dự án
- Phân quyền xem file (tất cả hoặc chỉ những người được chia sẻ)
- Chỉ người upload mới có thể xóa file
- Lịch sử các phiên bản file (thêm, sửa, xóa)

## Cấu trúc dự án

```
file-management/
├── backend/          # NestJS API
│   ├── src/
│   │   ├── auth/     # Authentication module
│   │   ├── users/    # User management
│   │   ├── projects/ # Project management
│   │   └── files/    # File management
│   └── ...
└── frontend/         # React app
    ├── src/
    │   ├── pages/    # Pages
    │   ├── components/ # Components
    │   ├── services/ # API services
    │   └── contexts/ # Context providers
    └── ...
```

