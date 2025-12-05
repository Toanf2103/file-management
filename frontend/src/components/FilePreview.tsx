import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Spin, Collapse, Tag, Space, Button } from 'antd';
import { InfoCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';
import api from '../services/api';

interface FilePreviewProps {
  visible: boolean;
  file: {
    _id: string;
    name: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
  } | null;
  fileUrl: string | null;
  onClose: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ visible, file, fileUrl, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Helper function để xác định file type - di chuyển ra ngoài để có thể dùng trước early return
  const getFileTypeFromMime = (mimeType: string | undefined): string => {
    if (!mimeType) return 'unsupported';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document') || mimeType.includes('docx')) return 'docx';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType.includes('xlsx')) return 'xlsx';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation') || mimeType.includes('pptx')) return 'pptx';
    if (mimeType.includes('text')) return 'txt';
    if (mimeType.includes('csv')) return 'csv';
    return 'unsupported';
  };

  // Tính fileType ngay cả khi file là null - phải đặt trước hooks
  const fileType = getFileTypeFromMime(file?.mimeType);

  // Tạo documents array cho DocViewer - PHẢI đặt trước early return để tuân thủ quy tắc hooks
  const documents = useMemo(() => {
    if (!previewUrl || fileType === 'image') return [];
    return [{ uri: previewUrl }];
  }, [previewUrl, fileType]);

  useEffect(() => {
    if (visible && file) {
      setError(null);
      setLoading(true);
      
      // Sử dụng fileUrl trực tiếp
      setPreviewUrl(fileUrl);
    }
    
    return () => {
      setPreviewUrl(null);
    };
  }, [visible, file, fileUrl]);

  if (!file || !fileUrl) {
    return null;
  }

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setError('Không thể load ảnh. Vui lòng thử lại hoặc download để xem.');
    setLoading(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileExtension = (fileName: string): string => {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  };


  const handleDownload = async () => {
    try {
      const blob = await api.get(`/files/${file._id}/download`, { responseType: 'blob' }).then((res) => res.data);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Download error:', error);
      setError('Không thể download file');
    }
  };

  const renderFilePreview = () => {
    if (error) {
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ color: '#ff4d4f', fontSize: '16px', marginBottom: '8px' }}>{error}</p>
          <p style={{ color: '#666', marginBottom: '16px' }}>File type: {file.mimeType}</p>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
            Download để xem
          </Button>
        </div>
      );
    }

    if (fileType === 'unsupported') {
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>Loại file này không được hỗ trợ preview.</p>
          <p style={{ color: '#666', marginBottom: '16px' }}>File type: {file.mimeType}</p>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
            Download để xem
          </Button>
        </div>
      );
    }

    if (fileType === 'image') {
      return (
        <div
          style={{
            height: '75vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'auto',
            background: '#f5f5f5',
            borderRadius: '8px',
          }}
        >
          {loading && (
            <Spin size="large" style={{ position: 'absolute' }} />
          )}
          <img
            src={fileUrl}
            alt={file.name || file.originalName}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              display: loading ? 'none' : 'block',
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
      );
    }

    if (fileType === 'docx' || fileType === 'xlsx' || fileType === 'pptx') {
      // Office documents - sử dụng DocViewer với blob URL
      return (
        <div style={{ height: '75vh', border: '1px solid #e8e8e8', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
          {loading && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
              }}
            >
              <Spin size="large" />
            </div>
          )}
          <DocViewer
            documents={documents}
            pluginRenderers={DocViewerRenderers}
            config={{
              header: {
                disableHeader: false,
                disableFileName: false,
                retainURLParams: false,
              },
            }}
            style={{ height: '100%' }}
            onDocumentChange={() => setLoading(false)}
          />
          {documents.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p style={{ marginBottom: '16px' }}>Đang tải file...</p>
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
                Download để xem
              </Button>
            </div>
          )}
        </div>
      );
    }

    // PDF và các file khác sử dụng DocViewer
    return (
      <div style={{ height: '75vh', overflow: 'hidden', borderRadius: '8px' }} key={file._id}>
        <DocViewer
          documents={documents}
          pluginRenderers={DocViewerRenderers}
          config={{
            header: {
              disableHeader: false,
              disableFileName: false,
              retainURLParams: false,
            },
          }}
          style={{ height: '100%' }}
        />
      </div>
    );
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{file.name || file.originalName}</span>
          <Tag color="blue">{getFileExtension(file.originalName)?.toUpperCase() || 'FILE'}</Tag>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width="95%"
      style={{ top: 10 }}
      destroyOnClose
      styles={{
        body: { padding: '16px', maxHeight: '85vh', overflow: 'auto' },
      }}
    >
      <Collapse
        ghost
        defaultActiveKey={[]}
        style={{ marginBottom: '16px' }}
        items={[
          {
            key: 'info',
            label: (
              <Space>
                <InfoCircleOutlined />
                <span>Thông tin file</span>
              </Space>
            ),
            children: (
              <div style={{ padding: '8px 0' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Tiêu đề:</strong> {file.name || '(Không có)'}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Tên file:</strong> {file.originalName}
                  {getFileExtension(file.originalName) && (
                    <Tag style={{ marginLeft: '8px' }}>.{getFileExtension(file.originalName)}</Tag>
                  )}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Kích thước:</strong> {formatFileSize(file.fileSize)}
                </div>
                <div>
                  <strong>Loại file:</strong> <Tag>{file.mimeType}</Tag>
                </div>
              </div>
            ),
          },
        ]}
      />

      <div style={{ position: 'relative' }}>{renderFilePreview()}</div>
    </Modal>
  );
};

export default FilePreview;