/**
 * Runtime configuration helper
 * Đọc config từ window.__RUNTIME_CONFIG__ được inject bởi docker-entrypoint.sh
 */

interface RuntimeConfig {
  VITE_API_URL?: string;
}

// Lấy config từ window object (được inject tại runtime)
const getRuntimeConfig = (): RuntimeConfig => {
  if (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__) {
    return (window as any).__RUNTIME_CONFIG__;
  }
  return {};
};

// Hàm helper để lấy giá trị config với fallback
export const getConfig = (key: keyof RuntimeConfig, fallback?: string): string => {
  const runtimeConfig = getRuntimeConfig();
  const value = runtimeConfig[key];
  
  // Ưu tiên runtime config, sau đó là build-time env, cuối cùng là fallback
  if (value) return value;
  if (import.meta.env[key]) return import.meta.env[key] as string;
  return fallback || '';
};

// Export các giá trị config thường dùng
export const API_URL = getConfig('VITE_API_URL', 'http://localhost:3000');

