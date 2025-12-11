import axios from 'axios';
import { config } from '../config/runtime-config';

const api = axios.create({
  url: config.apiUrl,
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('API Request:', {
    url: config,
    method: config.method,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    headers: config.headers,
  });
  
  if (token) {
    // Ensure Authorization header is set for all requests, including blob
    if (!config.headers) {
      config.headers = {} as any;
    }
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Authorization header set:', config.headers.Authorization?.substring(0, 20) + '...');
  } else {
    console.warn('⚠️ No token found in localStorage');
  }
  return config;
});

// Handle 401 and 403 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      requestHeaders: error.config?.headers,
    });
    
    // Không xóa token nếu lỗi từ download-avatar (vì có thể do avatar chưa có)
    const isAvatarRequest = error.config?.url?.includes('download-avatar');
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (!isAvatarRequest) {
        console.warn('⚠️ Unauthorized/Forbidden - Clearing token');
        // Clear token and redirect to login if unauthorized or forbidden
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (error.response?.status === 401) {
          window.location.href = '/login';
        }
      } else {
        console.warn('⚠️ Avatar request failed (may not exist yet) - Not clearing token');
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((res) => res.data),
};

export const usersService = {
  getAll: () => api.get('/users').then((res) => res.data),
  create: (data: any) => api.post('/users', data).then((res) => res.data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data).then((res) => res.data),
  delete: (id: string) => api.delete(`/users/${id}`).then((res) => res.data),
  resetPassword: (id: string, newPassword: string) =>
    api.post(`/users/${id}/reset-password`, { newPassword }).then((res) => res.data),
  updateRole: (id: string, role: string) =>
    api.patch(`/users/${id}/role`, { role }).then((res) => res.data),
  getProfile: () => api.get('/users/profile').then((res) => res.data),
  updateProfile: (data: any) => api.patch('/users/profile', data).then((res) => res.data),
  updateAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data);
  },
  getAvatarUrl: (avatarPath: string): string | null => {
    if (!avatarPath) return null;
    const token = localStorage.getItem('token');
    if (!token) return null;
    // ✅ Sử dụng getter để lấy API URL động
    const apiUrl = config.apiUrl;
    // Tạo URL với token trong query param (tạm thời, tốt hơn là dùng blob URL)
    return `${apiUrl}/files/download-avatar?path=${encodeURIComponent(avatarPath)}&token=${encodeURIComponent(token)}`;
  },
  getAvatarBlob: async (avatarPath: string): Promise<string | null> => {
    if (!avatarPath) return null;
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const blob = await api.get(`/files/download-avatar?path=${encodeURIComponent(avatarPath)}`, {
        responseType: 'blob',
      }).then((res) => res.data);
      return window.URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error loading avatar:', error);
      return null;
    }
  },
};

export const projectsService = {
  getAll: () => api.get('/projects').then((res) => res.data),
  getById: (id: string) => api.get(`/projects/${id}`).then((res) => res.data),
  create: (data: any) => api.post('/projects', data).then((res) => res.data),
  addMember: (id: string, userId: string) =>
    api.post(`/projects/${id}/members`, { userId }).then((res) => res.data),
  removeMember: (id: string, memberId: string) =>
    api.delete(`/projects/${id}/members/${memberId}`).then((res) => res.data),
};

export const filesService = {
  upload: (projectId: string, file: File, visibility: string, sharedWith: string[] = [], name?: string, parentFolderId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('visibility', visibility);
    if (sharedWith && sharedWith.length > 0) {
      formData.append('sharedWith', JSON.stringify(sharedWith));
    }
    if (name) {
      formData.append('name', name);
    }
    if (parentFolderId) {
      formData.append('parentFolderId', parentFolderId);
    }
    return api.post(`/files/upload/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data);
  },
  getByProject: (projectId: string, parentFolderId?: string) => {
    const params = parentFolderId ? { parentFolderId } : {};
    return api.get(`/files/project/${projectId}`, { params }).then((res) => res.data);
  },
  getById: (id: string) => api.get(`/files/${id}`).then((res) => res.data),
  download: (id: string) =>
    api.get(`/files/${id}/download`, { responseType: 'blob' }).then((res) => res.data),
  update: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.put(`/files/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data);
  },
  delete: (id: string) => api.delete(`/files/${id}`).then((res) => res.data),
  getHistory: (id: string) => api.get(`/files/${id}/history`).then((res) => res.data),
  createFolder: (projectId: string, name: string, parentFolderId?: string) =>
    api.post(`/files/folder/${projectId}`, { name, parentFolderId }).then((res) => res.data),
  moveItem: (id: string, targetFolderId?: string | null) =>
    api.put(`/files/${id}/move`, { targetFolderId }).then((res) => res.data),
};

export default api;