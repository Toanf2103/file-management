#!/bin/sh
set -e

# Tạo file config.js với các biến môi trường runtime
cat > /usr/share/nginx/html/config.js <<EOF
window.__RUNTIME_CONFIG__ = {
  VITE_API_URL: "${VITE_API_URL:-}"
};
EOF

# Thêm script tag vào index.html nếu chưa có
# Kiểm tra file tồn tại và chưa có script tag
if [ -f /usr/share/nginx/html/index.html ] && ! grep -q "config.js" /usr/share/nginx/html/index.html; then
  # Tạo file tạm với script tag đã được thêm vào (tương thích cả Ubuntu và Alpine)
  sed 's|</head>|<script src="/config.js"></script></head>|' /usr/share/nginx/html/index.html > /tmp/index.html.$$
  mv /tmp/index.html.$$ /usr/share/nginx/html/index.html
fi

# Khởi động nginx
exec nginx -g "daemon off;"

