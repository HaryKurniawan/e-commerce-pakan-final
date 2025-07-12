import React from 'react';
import '../styles/VoucherSection.css';

const VoucherSection = ({
  voucherCode,
  setVoucherCode,
  onApplyVoucher,
  onRemoveVoucher,
  appliedVoucher,
  loading
}) => {
  return (
    <div className="voucher-section">
      <div className="voucher-input-section">
        <div className="voucher-input-group">
          <input
            type="text"
            placeholder="Masukkan kode voucher"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            className="voucher-input"
            disabled={loading || appliedVoucher}
          />
          <button
            onClick={appliedVoucher ? onRemoveVoucher : onApplyVoucher}
            disabled={loading || (!appliedVoucher && !voucherCode.trim())}
            className="apply-voucher-btn"
          >
            {loading ? 'Validating...' : appliedVoucher ? 'Hapus Voucher' : 'Gunakan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoucherSection;