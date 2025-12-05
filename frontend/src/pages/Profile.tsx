import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Upload, Avatar, message, Space } from 'antd';
import { UserOutlined, CameraOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { usersService } from '../services/api';
import { useAvatar } from '../hooks/useAvatar';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [form] = Form.useForm();
  const { avatarUrl } = useAvatar(profile?.avatar || user?.avatar);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await usersService.getProfile();
      setProfile(data);
      form.setFieldsValue({
        fullName: data.fullName,
      });
    } catch (error: any) {
      message.error('Lỗi khi tải thông tin cá nhân');
    }
  };

  const handleUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      const data: any = {
        fullName: values.fullName,
      };

      if (values.newPassword) {
        if (!values.currentPassword) {
          message.error('Vui lòng nhập mật khẩu hiện tại');
          setLoading(false);
          return;
        }
        data.currentPassword = values.currentPassword;
        data.newPassword = values.newPassword;
      }

      await usersService.updateProfile(data);
      message.success('Cập nhật thông tin thành công');
      
      // Update user in context
      if (user) {
        updateUser({
          ...user,
          fullName: values.fullName,
          avatar: profile?.avatar || user.avatar,
        });
      }
      
      // Reload profile to get updated data
      loadProfile();
      
      form.resetFields(['currentPassword', 'newPassword', 'confirmPassword']);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setAvatarLoading(true);
    try {
      const response = await usersService.updateAvatar(file);
      message.success('Cập nhật avatar thành công');
      
      // Update user in context
      if (user) {
        updateUser({
          ...user,
          avatar: response.user.avatar,
        });
      }
      
      loadProfile();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi cập nhật avatar');
    } finally {
      setAvatarLoading(false);
    }
    return false; // Prevent auto upload
  };


  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Card title="Thông tin cá nhân">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Space direction="vertical" size="large">
            <Avatar
              size={120}
              src={avatarUrl || undefined}
              icon={<UserOutlined />}
              style={{ fontSize: 60 }}
            />
            <div>
              <Upload
                beforeUpload={handleAvatarUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button
                  icon={<CameraOutlined />}
                  loading={avatarLoading}
                  type="primary"
                >
                  Đổi avatar
                </Button>
              </Upload>
            </div>
          </Space>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
        >
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
          >
            <Input value={user?.email} disabled />
          </Form.Item>

          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            tooltip="Chỉ cần nhập nếu muốn đổi mật khẩu"
          >
            <Input.Password placeholder="Nhập mật khẩu hiện tại" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              {
                validator: (_, value) => {
                  if (!value && form.getFieldValue('currentPassword')) {
                    return Promise.reject(new Error('Vui lòng nhập mật khẩu mới!'));
                  }
                  if (value && value.length < 6) {
                    return Promise.reject(new Error('Mật khẩu phải có ít nhất 6 ký tự!'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            dependencies={['newPassword']}
            rules={[
              {
                validator: (_, value) => {
                  const newPassword = form.getFieldValue('newPassword');
                  if (newPassword && !value) {
                    return Promise.reject(new Error('Vui lòng xác nhận mật khẩu!'));
                  }
                  if (newPassword && value !== newPassword) {
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input.Password placeholder="Xác nhận mật khẩu mới" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              Lưu thay đổi
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Profile;

