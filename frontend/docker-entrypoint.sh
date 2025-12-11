#!/bin/sh
set -e

echo "==> Creating runtime config..."

# Tạo file config.js với các biến môi trường runtime
cat > /usr/share/nginx/html/config.js <<EOF
window.__RUNTIME_CONFIG__ = {
  VITE_API_URL: "${VITE_API_URL:-http://localhost:3000}"
};
EOF

echo "==> Config created:"
cat /usr/share/nginx/html/config.js

# Inject script tag vào index.html
INDEX_FILE="/usr/share/nginx/html/index.html"

if [ -f "$INDEX_FILE" ]; then
  echo "==> Injecting config.js into index.html..."
  
  # Kiểm tra xem đã có script tag chưa
  if ! grep -q "config.js" "$INDEX_FILE"; then
    # Sử dụng sed với -i (in-place) cho Alpine Linux
    sed -i 's|</head>|  <script src="/config.js"></script>\n</head>|' "$INDEX_FILE"
    echo "==> Script tag injected successfully"
  else
    echo "==> Script tag already exists"
  fi
  
  # Verify
  echo "==> Verifying injection:"
  grep -A2 "config.js" "$INDEX_FILE" || echo "WARNING: Script tag not found!"
else
  echo "ERROR: index.html not found!"
  exit 1
fi

echo "==> Starting nginx..."
exec nginx -g "daemon off;"