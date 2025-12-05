import { Routes, Route } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import Projects from './Projects';
import ProjectDetail from './ProjectDetail';

const UserDashboard = () => {
  return (
    <UserLayout>
      <Routes>
        <Route path="/" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
      </Routes>
    </UserLayout>
  );
};

export default UserDashboard;

