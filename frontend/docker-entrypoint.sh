#!/bin/sh
set -e

echo "==> Environment variables:"
echo "VITE_API_URL=${VITE_API_URL}"

# Tạo file config.js - sử dụng dấu nháy đơn bên ngoài
cat > /usr/share/nginx/html/config.js <<'EOF'
window.__RUNTIME_CONFIG__ = {
  VITE_API_URL: "PLACEHOLDER_API_URL"
};
EOF

# Thay thế placeholder bằng giá trị thực
sed -i "s|PLACEHOLDER_API_URL|${VITE_API_URL}|g" /usr/share/nginx/html/config.js

echo "==> Config file created:"
cat /usr/share/nginx/html/config.js

# Inject script tag vào index.html
INDEX_FILE="/usr/share/nginx/html/index.html"

if [ -f "$INDEX_FILE" ]; then
  if ! grep -q "config.js" "$INDEX_FILE"; then
    sed -i 's|</head>|  <script src="/config.js"></script>\n</head>|' "$INDEX_FILE"
    echo "==> Script tag injected"
  fi
else
  echo "ERROR: index.html not found!"
fi

exec nginx -g "daemon off;"