import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Upload,
  Select,
  message,
  Space,
  Tag,
  Popconfirm,
  Drawer,
  Timeline,
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  HistoryOutlined,
  UserAddOutlined,
  ArrowLeftOutlined,
  FolderOutlined,
  FileOutlined,
  FolderAddOutlined,
  ArrowUpOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { projectsService, filesService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import FilePreview from '../../components/FilePreview';

const { Option } = Select;

interface File {
  _id: string;
  fileName: string;
  originalName: string;
  name: string;
  type: 'file' | 'folder';
  parentFolder?: string | null;
  fileSize: number;
  mimeType?: string; // Thêm mimeType cho FilePreview component
  uploadedBy: {
    email: string;
    fullName: string;
    _id: string;
  };
  visibility: 'shared' | 'all';
  sharedWith: string[];
  createdAt: string;
}

interface Project {
  _id: string;
  name: string;
  createdBy: {
    email: string;
    fullName: string;
  };
  members: Array<{
    userId: string | { _id: string; email?: string; fullName?: string };
    role: string;
  }>;
}

interface User {
  _id: string;
  email: string;
  fullName: string;
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [createFolderModalVisible, setCreateFolderModalVisible] = useState(false);
  const [moveItemModalVisible, setMoveItemModalVisible] = useState(false);
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [selectedItemForMove, setSelectedItemForMove] = useState<File | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderBreadcrumb, setFolderBreadcrumb] = useState<any[]>([]);
  const [fileHistory, setFileHistory] = useState<any[]>([]);
  const [uploadForm] = Form.useForm();
  const [memberForm] = Form.useForm();
  const [folderForm] = Form.useForm();
  const [moveForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadProject();
      loadFiles(null);
      setCurrentFolderId(null);
      setFolderBreadcrumb([]);
    }
  }, [id]);

  const loadProject = async () => {
    try {
      const data = await projectsService.getById(id!);
      setProject(data);
      // Load users from project members
      if (data.members) {
        const memberUsers = data.members.map((m: any) => ({
          _id: typeof m.userId === 'string' ? m.userId : m.userId?._id || m.userId,
          email: m.userId?.email || '',
          fullName: m.userId?.fullName || '',
          role: m.role || 'member',
        }));
        setUsers(memberUsers);
      }
    } catch (error: any) {
      message.error('Lỗi khi tải thông tin dự án');
    }
  };

  const loadFiles = async (folderId?: string | null) => {
    setLoading(true);
    try {
      const data = await filesService.getByProject(id!, folderId || undefined);
      setFiles(data);
    } catch (error: any) {
      message.error('Lỗi khi tải danh sách file');
    } finally {
      setLoading(false);
    }
  };

  const isProjectOwner = () => {
    if (!project || !user) return false;
    return project.members?.some(
      (m) => {
        const memberUserId = typeof m.userId === 'string' ? m.userId : (m.userId && typeof m.userId === 'object' ? m.userId._id : null);
        return memberUserId === user.id && m.role === 'owner';
      }
    );
  };

  const handleUpload = async (values: any) => {
    try {
      const file = values.file?.file || values.file;
      if (!file) {
        message.error('Vui lòng chọn file!');
        return;
      }
      const visibility = values.visibility;
      const sharedWith = values.sharedWith || [];
      const name = values.name || file.name;

      await filesService.upload(id!, file, visibility, sharedWith, name, currentFolderId || undefined);
      message.success('Upload file thành công');
      setUploadModalVisible(false);
      uploadForm.resetFields();
      loadFiles(currentFolderId);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi upload file');
    }
  };

  const handleCreateFolder = async (values: { name: string }) => {
    try {
      await filesService.createFolder(id!, values.name, currentFolderId || undefined);
      message.success('Tạo folder thành công');
      setCreateFolderModalVisible(false);
      folderForm.resetFields();
      loadFiles(currentFolderId);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi tạo folder');
    }
  };

  const handleMoveItem = async (values: { targetFolderId?: string }) => {
    if (!selectedItemForMove) return;
    try {
      await filesService.moveItem(selectedItemForMove._id, values.targetFolderId || null);
      message.success('Di chuyển thành công');
      setMoveItemModalVisible(false);
      setSelectedItemForMove(null);
      moveForm.resetFields();
      loadFiles(currentFolderId);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi di chuyển');
    }
  };

  const handleFolderClick = (folder: File) => {
    setCurrentFolderId(folder._id);
    loadFiles(folder._id);
    // Update breadcrumb
    setFolderBreadcrumb([...folderBreadcrumb, { id: folder._id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumb = folderBreadcrumb.slice(0, index + 1);
    setFolderBreadcrumb(newBreadcrumb);
    if (index === -1) {
      setCurrentFolderId(null);
      loadFiles(null);
    } else {
      const folder = newBreadcrumb[newBreadcrumb.length - 1];
      setCurrentFolderId(folder.id);
      loadFiles(folder.id);
    }
  };

  const handleDownload = async (fileId: string) => {
    try {
      const blob = await filesService.download(fileId);
      const file = files.find((f) => f._id === fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file?.originalName || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('Download file thành công');
    } catch (error: any) {
      console.error('Download error:', error);
      if (error.response?.status === 401) {
        message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
      } else {
        message.error(error.response?.data?.message || 'Lỗi khi download file');
      }
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      await filesService.delete(fileId);
      message.success('Xóa thành công');
      loadFiles(currentFolderId);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi xóa file');
    }
  };

  const handleAddMember = async (values: { userId: string }) => {
    try {
      await projectsService.addMember(id!, values.userId);
      message.success('Thêm thành viên thành công');
      setAddMemberModalVisible(false);
      memberForm.resetFields();
      loadProject();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi thêm thành viên');
    }
  };

  const handleViewHistory = async (fileId: string) => {
    try {
      const history = await filesService.getHistory(fileId);
      setFileHistory(history);
      setHistoryDrawerVisible(true);
    } catch (error: any) {
      message.error('Lỗi khi tải lịch sử');
    }
  };

  const handlePreview = async (file: File) => {
    if (file.type !== 'file') return;
    
    try {
      // Download file và tạo blob URL
      const blob = await filesService.download(file._id);
      const url = window.URL.createObjectURL(blob);
      setPreviewFileUrl(url);
      setPreviewFile(file);
      setPreviewModalVisible(true);
    } catch (error: any) {
      message.error('Lỗi khi tải file để preview');
    }
  };

  const handleClosePreview = () => {
    setPreviewModalVisible(false);
    if (previewFileUrl) {
      window.URL.revokeObjectURL(previewFileUrl);
      setPreviewFileUrl(null);
    }
    setPreviewFile(null);
  };

  const canViewFile = (file: File) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (isProjectOwner()) return true;
    if (file.visibility === 'all') return true;
    if (file.sharedWith?.some((id: any) => (typeof id === 'string' ? id : id._id || id.toString()) === user.id)) return true;
    if (file.uploadedBy?._id === user.id || (typeof file.uploadedBy === 'string' && file.uploadedBy === user.id)) return true;
    return false;
  };

  const canDeleteFile = (file: File) => {
    if (!user) return false;
    const uploadedById = typeof file.uploadedBy === 'string' 
      ? file.uploadedBy 
      : file.uploadedBy?._id;
    return uploadedById === user.id;
  };

  const canMoveItem = (item: File) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (isProjectOwner()) return true;
    // Regular users can only move their own folders
    if (item.type === 'folder') {
      const uploadedById = typeof item.uploadedBy === 'string' 
        ? item.uploadedBy 
        : item.uploadedBy?._id;
      return uploadedById === user.id;
    }
    // Project owner can move any file
    return isProjectOwner();
  };

  const columns = [
    {
      title: 'Tên',
      key: 'name',
      render: (_: any, record: File) => (
        <div>
          <Space>
            {record.type === 'folder' ? (
              <FolderOutlined style={{ color: '#1890ff' }} />
            ) : (
              <FileOutlined />
            )}
            <span
              style={{ cursor: record.type === 'folder' ? 'pointer' : 'default' }}
              onClick={() => record.type === 'folder' && handleFolderClick(record)}
            >
              {record.name || record.originalName}
            </span>
          </Space>
          {record.type === 'file' && record.name && record.name !== record.originalName && (
            <div style={{ marginLeft: 24, fontSize: 12, color: '#666', marginTop: 4 }}>
              {record.originalName}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Kích thước',
      key: 'fileSize',
      render: (_: any, record: File) => {
        const size = record.fileSize;
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
      },
    },
    {
      title: 'Người upload',
      key: 'uploadedBy',
      render: (_: any, record: File) => {
        if (typeof record.uploadedBy === 'string') {
          return record.uploadedBy;
        }
        return record.uploadedBy?.fullName || record.uploadedBy?.email || 'Unknown';
      },
    },
    {
      title: 'Phạm vi',
      key: 'visibility',
      render: (_: any, record: File) => (
        <Tag color={record.visibility === 'all' ? 'green' : 'blue'}>
          {record.visibility === 'all' ? 'Tất cả' : 'Chia sẻ'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: File) => {
        const canView = canViewFile(record);
        const canDelete = canDeleteFile(record);
        const canMove = canMoveItem(record);

        return (
          <Space>
            {record.type === 'file' && canView && (
              <>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => handlePreview(record)}
                >
                  Preview
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(record._id)}
                >
                  Download
                </Button>
              </>
            )}
            {record.type === 'file' && (
              <Button
                icon={<HistoryOutlined />}
                onClick={() => handleViewHistory(record._id)}
              >
                Lịch sử
              </Button>
            )}
            {canMove && (
              <Button
                icon={<ArrowUpOutlined />}
                onClick={() => {
                  setSelectedItemForMove(record);
                  setMoveItemModalVisible(true);
                }}
              >
                Di chuyển
              </Button>
            )}
            {canDelete && (
              <Popconfirm
                title={`Bạn có chắc muốn xóa ${record.type === 'folder' ? 'folder' : 'file'} này?`}
                onConfirm={() => handleDelete(record._id)}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Xóa
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  const filteredFiles = files.filter((file) => canViewFile(file));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/user')}>
          Quay lại
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <h1>{project?.name}</h1>
        {folderBreadcrumb.length > 0 && (
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            <Space>
              <Button
                type="link"
                icon={<ArrowUpOutlined />}
                onClick={() => handleBreadcrumbClick(-1)}
              >
                Root
              </Button>
              {folderBreadcrumb.map((folder, index) => (
                <span key={folder.id}>
                  <span>/</span>
                  <Button
                    type="link"
                    onClick={() => handleBreadcrumbClick(index)}
                  >
                    {folder.name}
                  </Button>
                </span>
              ))}
            </Space>
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <Space>
            {isProjectOwner() && (
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setAddMemberModalVisible(true)}
              >
                Thêm thành viên
              </Button>
            )}
            <Button
              icon={<FolderAddOutlined />}
              onClick={() => setCreateFolderModalVisible(true)}
            >
              Tạo Folder
            </Button>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setUploadModalVisible(true)}
            >
              Upload File
            </Button>
          </Space>
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredFiles}
        rowKey="_id"
        loading={loading}
      />

      <Modal
        title="Upload File"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          uploadForm.resetFields();
        }}
        footer={null}
      >
        <Form form={uploadForm} onFinish={handleUpload} layout="vertical">
          <Form.Item
            name="file"
            label="File"
            rules={[{ required: true, message: 'Vui lòng chọn file!' }]}
            valuePropName="file"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e[0];
              }
              return e?.file || e;
            }}
          >
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Chọn file</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên tài liệu"
            tooltip="Tên mô tả cho tài liệu (tùy chọn)"
          >
            <Input placeholder="Nhập tên tài liệu" />
          </Form.Item>

          <Form.Item
            name="visibility"
            label="Phạm vi"
            initialValue="all"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="all">Tất cả thành viên dự án</Option>
              <Option value="shared">Chỉ những người được chia sẻ</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.visibility !== currentValues.visibility
            }
          >
            {({ getFieldValue }) =>
              getFieldValue('visibility') === 'shared' ? (
                <Form.Item
                  name="sharedWith"
                  label="Chia sẻ với"
                  rules={[{ required: true, message: 'Vui lòng chọn ít nhất một người!' }]}
                >
                  <Select mode="multiple" placeholder="Chọn người dùng">
                    {users.map((u) => (
                      <Option key={u._id} value={u._id}>
                        {u.fullName} ({u.email})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Upload
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Thêm thành viên"
        open={addMemberModalVisible}
        onCancel={() => {
          setAddMemberModalVisible(false);
          memberForm.resetFields();
        }}
        footer={null}
      >
        <Form form={memberForm} onFinish={handleAddMember} layout="vertical">
          <Form.Item
            name="userId"
            label="Người dùng"
            rules={[{ required: true, message: 'Vui lòng chọn người dùng!' }]}
          >
            <Select placeholder="Chọn người dùng">
              {users
                .filter(
                  (u) =>
                    !project?.members?.some((m) => {
                      const memberUserId = typeof m.userId === 'string' ? m.userId : (m.userId && typeof m.userId === 'object' ? m.userId._id : null);
                      return memberUserId === u._id;
                    })
                )
                .map((u) => (
                  <Option key={u._id} value={u._id}>
                    {u.fullName} ({u.email})
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Thêm
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tạo Folder"
        open={createFolderModalVisible}
        onCancel={() => {
          setCreateFolderModalVisible(false);
          folderForm.resetFields();
        }}
        footer={null}
      >
        <Form form={folderForm} onFinish={handleCreateFolder} layout="vertical">
          <Form.Item
            name="name"
            label="Tên folder"
            rules={[{ required: true, message: 'Vui lòng nhập tên folder!' }]}
          >
            <Input placeholder="Nhập tên folder" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Tạo
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Di chuyển"
        open={moveItemModalVisible}
        onCancel={() => {
          setMoveItemModalVisible(false);
          setSelectedItemForMove(null);
          moveForm.resetFields();
        }}
        footer={null}
      >
        <Form form={moveForm} onFinish={handleMoveItem} layout="vertical">
          <Form.Item
            name="targetFolderId"
            label="Di chuyển đến folder"
          >
            <Select placeholder="Chọn folder (để trống để di chuyển về root)" allowClear>
              {files
                .filter((f) => f.type === 'folder' && f._id !== selectedItemForMove?._id)
                .map((f) => (
                  <Option key={f._id} value={f._id}>
                    {f.name}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Di chuyển
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="Lịch sử file"
        placement="right"
        onClose={() => setHistoryDrawerVisible(false)}
        open={historyDrawerVisible}
        width={400}
      >
        <Timeline>
          {fileHistory.map((version, index) => (
            <Timeline.Item key={index} color={version.action === 'delete' ? 'red' : 'blue'}>
              <p>
                <strong>Phiên bản {version.version}</strong>
              </p>
              <p>Hành động: {version.action}</p>
              <p>Kích thước: {(version.fileSize / 1024).toFixed(2)} KB</p>
              <p>Thời gian: {new Date(version.createdAt).toLocaleString('vi-VN')}</p>
            </Timeline.Item>
          ))}
        </Timeline>
      </Drawer>

      <FilePreview
        visible={previewModalVisible}
        file={previewFile ? {
          _id: previewFile._id,
          name: previewFile.name,
          originalName: previewFile.originalName,
          mimeType: previewFile.mimeType || 'application/octet-stream',
          fileSize: previewFile.fileSize,
        } : null}
        fileUrl={previewFileUrl}
        onClose={handleClosePreview}
      />
    </div>
  );
};

export default ProjectDetail;

