import React from 'react';
import { Modal, Button } from 'antd';
import { MailOpen } from 'lucide-react';
import './ModalResendLimit.css';

const ModalResendLimit = ({ visible, onClose }) => {
  return (
    <Modal
      // title="Pengiriman Ulang Email Dibatasi"
      open={visible}
      onCancel={onClose}
      width={600} // Custom width modal
      footer={null} // Hapus footer default
      className="custom-modal-resend"
    >
      <div className="modal-content-center">
        <MailOpen size={64} color="#1890ff" style={{ marginBottom: 16 }} />
        <p style={{ textAlign: 'center', marginBottom: 24 }}>
          Fitur ini dibatasi sementara karena pemeliharaan.
          Gunakan email lain atau hubungi developer.
        </p>
        
        {/* Custom button dengan width 100% */}
        <Button 
          key="ok" 
          type="primary" 
          onClick={onClose}
          className="full-width-button"
          size="large"
        >
          Oke
        </Button>
      </div>
    </Modal>
  );
};

export default ModalResendLimit;