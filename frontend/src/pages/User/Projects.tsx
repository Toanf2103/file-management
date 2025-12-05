import { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Input, message, Space, Tag } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { projectsService } from '../../services/api';

interface Project {
  _id: string;
  name: string;
  createdBy: {
    email: string;
    fullName: string;
  };
  members: Array<{
    userId: string;
    role: string;
  }>;
  createdAt: string;
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await projectsService.getAll();
      setProjects(data);
    } catch (error: any) {
      message.error('Lỗi khi tải danh sách dự án');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: { name: string }) => {
    try {
      await projectsService.create(values);
      message.success('Tạo dự án thành công');
      setModalVisible(false);
      form.resetFields();
      loadProjects();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi tạo dự án');
    }
  };

  const columns = [
    {
      title: 'Tên dự án',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Người tạo',
      key: 'createdBy',
      render: (_: any, record: Project) => record.createdBy?.fullName || record.createdBy?.email,
    },
    {
      title: 'Thành viên',
      key: 'members',
      render: (_: any, record: Project) => (
        <Tag>{record.members?.length || 0} thành viên</Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Project) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/user/projects/${record._id}`)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dự án của tôi</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          Tạo dự án mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={projects}
        rowKey="_id"
        loading={loading}
      />

      <Modal
        title="Tạo dự án mới"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="name"
            label="Tên dự án"
            rules={[{ required: true, message: 'Vui lòng nhập tên dự án!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Tạo
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Projects;

