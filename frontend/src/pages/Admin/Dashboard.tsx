import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import UserManagement from './UserManagement';

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<UserManagement />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;

