import React, { useState, useEffect } from 'react';
import { Modal, Spin, message, Descriptions } from 'antd';
import FileViewer from 'react-file-viewer';

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

  useEffect(() => {
    if (visible) {
      setError(null);
      setLoading(true);
    }
  }, [visible]);

  if (!file || !fileUrl) {
    return null;
  }

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'docx';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'xlsx';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'pptx';
    if (mimeType.includes('text')) return 'txt';
    if (mimeType.includes('csv')) return 'csv';
    return 'unsupported';
  };

  const fileType = getFileType(file.mimeType);

  const onError = (e: Error) => {
    setError('Không thể preview file này. Vui lòng download để xem.');
    setLoading(false);
    console.error('File preview error:', e);
  };

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

  return (
    <Modal
      title={file.name || file.originalName}
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ top: 20 }}
      destroyOnClose
    >
      <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Tiêu đề file">
          {file.name || '(Không có)'}
        </Descriptions.Item>
        <Descriptions.Item label="Tên file">
          {file.originalName} {getFileExtension(file.originalName) && `(.${getFileExtension(file.originalName)})`}
        </Descriptions.Item>
        <Descriptions.Item label="Kích thước">
          {formatFileSize(file.fileSize)}
        </Descriptions.Item>
        <Descriptions.Item label="Loại file">
          {file.mimeType}
        </Descriptions.Item>
      </Descriptions>
      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
        {error ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p style={{ color: 'red' }}>{error}</p>
            <p>File type: {file.mimeType}</p>
            <p>Loại file này không được hỗ trợ preview. Vui lòng download để xem.</p>
          </div>
        ) : fileType === 'unsupported' ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>Loại file này không được hỗ trợ preview.</p>
            <p>File type: {file.mimeType}</p>
            <p>Vui lòng download để xem.</p>
          </div>
        ) : fileType === 'image' ? (
          <div style={{ 
            height: '70vh', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            overflow: 'auto',
            background: '#f5f5f5'
          }}>
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
                display: loading ? 'none' : 'block'
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
        ) : (
          <div style={{ height: '70vh', overflow: 'auto' }} key={file._id}>
            <FileViewer
              fileType={fileType}
              filePath={fileUrl}
              onError={onError}
              errorComponent={<div>Lỗi khi load file</div>}
              unsupportedComponent={<div>File không được hỗ trợ</div>}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default FilePreview;

