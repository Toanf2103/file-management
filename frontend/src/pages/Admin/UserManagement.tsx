import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { usersService } from '../../services/api';

const { Option } = Select;

interface User {
  _id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [resetPasswordForm] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersService.getAll();
      setUsers(data);
    } catch (error: any) {
      message.error('Lỗi khi tải danh sách users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        await usersService.update(editingUser._id, values);
        message.success('Cập nhật user thành công');
      } else {
        await usersService.create(values);
        message.success('Tạo user thành công');
      }
      setModalVisible(false);
      loadUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await usersService.delete(id);
      message.success('Xóa user thành công');
      loadUsers();
    } catch (error: any) {
      message.error('Lỗi khi xóa user');
    }
  };

  const handleResetPassword = (user: User) => {
    setEditingUser(user);
    resetPasswordForm.resetFields();
    setResetPasswordModalVisible(true);
  };

  const handleResetPasswordSubmit = async (values: any) => {
    try {
      await usersService.resetPassword(editingUser!._id, values.newPassword);
      message.success('Reset mật khẩu thành công');
      setResetPasswordModalVisible(false);
    } catch (error: any) {
      message.error('Lỗi khi reset mật khẩu');
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await usersService.updateRole(userId, role);
      message.success('Cập nhật quyền thành công');
      loadUsers();
    } catch (error: any) {
      message.error('Lỗi khi cập nhật quyền');
    }
  };

  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Quyền',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: User) => (
        <Select
          value={role}
          onChange={(value) => handleUpdateRole(record._id, value)}
          style={{ width: 120 }}
        >
          <Option value="admin">Admin</Option>
          <Option value="user">User</Option>
        </Select>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Button
            icon={<KeyOutlined />}
            onClick={() => handleResetPassword(record)}
          >
            Reset Pass
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa user này?"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Quản lý Users</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Thêm User
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="_id"
        loading={loading}
      />

      <Modal
        title={editingUser ? 'Sửa User' : 'Thêm User'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item
            name="fullName"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="role"
            label="Quyền"
            initialValue="user"
          >
            <Select>
              <Option value="admin">Admin</Option>
              <Option value="user">User</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingUser ? 'Cập nhật' : 'Tạo'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Reset Mật khẩu"
        open={resetPasswordModalVisible}
        onCancel={() => setResetPasswordModalVisible(false)}
        footer={null}
      >
        <Form form={resetPasswordForm} onFinish={handleResetPasswordSubmit} layout="vertical">
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Reset
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;

