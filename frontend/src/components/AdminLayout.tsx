import { Layout, Menu, Avatar, Dropdown } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useAvatar } from '../hooks/useAvatar';

const { Header, Content } = Layout;

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { avatarUrl } = useAvatar(user?.avatar);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menu = (
    <Menu>
      <Menu.Item key="profile" icon={<SettingOutlined />} onClick={() => navigate('/profile')}>
        Thông tin cá nhân
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Đăng xuất
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          File Management - Admin
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'white' }}>{user?.fullName}</span>
          <Dropdown overlay={menu} placement="bottomRight">
            <Avatar
              size="default"
              src={avatarUrl || undefined}
              icon={<UserOutlined />}
              style={{ cursor: 'pointer' }}
            />
          </Dropdown>
        </div>
      </Header>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        {children}
      </Content>
    </Layout>
  );
};

export default AdminLayout;

