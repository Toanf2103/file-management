import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const { Title } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Xử lý callback từ Google OAuth
  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    
    if (token) {
      // Lưu token và lấy thông tin user
      handleGoogleCallback(token);
    } else if (error) {
      message.error('Đăng nhập Google thất bại: ' + decodeURIComponent(error));
      setGoogleLoading(false);
    }
  }, [searchParams]);

  const handleGoogleCallback = async (token: string) => {
    try {
      setGoogleLoading(true);
      
      // Lưu token tạm thời
      localStorage.setItem('token', token);
      
      // Set authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Lấy thông tin user từ backend
      const userResponse = await api.get('/users/profile');
      const userData = userResponse.data;
      
      const user = {
        id: userData._id || userData.id,
        email: userData.email,
        fullName: userData.fullName,
        avatar: userData.avatar || '',
        role: userData.role,
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      updateUser(user);
      
      // Navigate based on user role
      navigate(user.role === 'admin' ? '/admin' : '/user');
      message.success('Đăng nhập thành công!');
      
      // Clean up URL - xóa query params
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error: any) {
      console.error('Google callback error:', error);
      message.error(error.response?.data?.message || 'Không thể lấy thông tin user. Vui lòng thử lại.');
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    // Redirect đến backend Google OAuth endpoint
    // Sử dụng full URL vì Google OAuth cần redirect URL đầy đủ
    const frontendUrl = window.location.origin;
    window.location.href = `${frontendUrl}/api/auth/google`;
  };

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      // Navigate based on user role
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(user.role === 'admin' ? '/admin' : '/user');
    } catch (error) {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 30 }}>
          Đăng nhập
        </Title>
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <Divider>hoặc</Divider>

        <Button
          type="default"
          icon={<GoogleOutlined />}
          block
          size="large"
          loading={googleLoading}
          onClick={handleGoogleLogin}
          style={{
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            borderColor: '#db4437',
            color: '#db4437',
          }}
        >
          Đăng nhập bằng Google
        </Button>
      </Card>
    </div>
  );
};

export default Login;

