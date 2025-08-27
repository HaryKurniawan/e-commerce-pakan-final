import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Copy, Check, CreditCard, Upload, X, ArrowLeft } from 'lucide-react';
import { notification } from 'antd'; // Import notification dari antd
import { ordersAPI } from '../services/ordersAPI';
import { productsAPI } from '../services/productsAPI';
import { useCart } from '../hooks/useCart';
import { useVouchers } from '../hooks/useVouchers';
import { useProducts } from '../hooks/useProducts';
import Header from '../components/common/Header'
import logoBRI from '../assets/bri.png';
import logoBNI from '../assets/bni.png';
import logoBCA from '../assets/bca.png';
import './Payment.css';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract data from location state
  const {
    orderData,
    cartItems,
    totalAmount,
    appliedVoucher,
    discountAmount = 0,
    finalAmount,
    primaryAddress,
    orderNotes,
    selectedPaymentMethod,
    stockChecks
  } = location.state || {};

  // Import hooks
  const { clearCart } = useCart();
  const { applyVoucher } = useVouchers();
  const { fetchProducts } = useProducts();

  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Logo mapping function
  const getBankLogo = (bankCode) => {
    switch (bankCode) {
      case 'BRI':
        return logoBRI;
      case 'BNI':
        return logoBNI;
      case 'BCA':
        return logoBCA;
      default:
        return null;
    }
  };

  // Calculate total quantity
  const getTotalQuantity = () => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce((total, item) => total + (item.jumlah || 0), 0);
  };

  // Redirect if no data
  useEffect(() => {
    if (!orderData || !selectedPaymentMethod) {
      alert('Data pembayaran tidak lengkap');
      navigate('/cart');
    }
  }, [orderData, selectedPaymentMethod, navigate]);

  const copyToClipboard = async (text, accountType) => {
    try {
      await navigator.clipboard.writeText(text);
      
      // Tampilkan notification sukses
      notification.success({
        message: 'Berhasil Disalin!',
        description: `${accountType} telah disalin ke clipboard`,
        placement: 'topRight',
        duration: 2,
      });
      
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        
        // Tampilkan notification sukses untuk fallback
        notification.success({
          message: 'Berhasil Disalin!',
          description: `${accountType} telah disalin ke clipboard`,
          placement: 'topRight',
          duration: 2,
        });
        
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
        
        // Tampilkan notification error
        notification.error({
          message: 'Gagal Menyalin',
          description: 'Silakan salin secara manual',
          placement: 'topRight',
          duration: 3,
        });
      }
      document.body.removeChild(textArea);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        notification.error({
          message: 'File Terlalu Besar',
          description: 'Ukuran file maksimal 5MB',
          placement: 'topRight',
          duration: 3,
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        notification.error({
          message: 'Format File Tidak Valid',
          description: 'Hanya file gambar yang diperbolehkan',
          placement: 'topRight',
          duration: 3,
        });
        return;
      }

      setPaymentProof(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPaymentProofPreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Tampilkan notification sukses upload
      notification.success({
        message: 'File Berhasil Dipilih',
        description: 'Bukti pembayaran siap untuk diupload',
        placement: 'topRight',
        duration: 2,
      });
    }
  };

  const removePaymentProof = () => {
    setPaymentProof(null);
    setPaymentProofPreview(null);
    // Reset file input
    const fileInput = document.getElementById('payment-proof-input');
    if (fileInput) {
      fileInput.value = '';
    }

    notification.info({
      message: 'File Dihapus',
      description: 'Bukti pembayaran telah dihapus',
      placement: 'topRight',
      duration: 2,
    });
  };

  const handlePaymentSubmit = async () => {
    if (!paymentProof) {
      notification.warning({
        message: 'Bukti Pembayaran Diperlukan',
        description: 'Silakan upload bukti pembayaran terlebih dahulu',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('Creating order with data:', orderData);

      // Create order first
      const order = await ordersAPI.createOrder(orderData);

      if (!order || !order.id) {
        throw new Error('Failed to create order - no order returned');
      }

      console.log('Order created successfully:', order);

      // Upload payment proof
      try {
        const uploadResult = await ordersAPI.uploadPaymentProof(
          order.id,
          orderData.user_id,
          paymentProof
        );

        if (!uploadResult.success) {
          throw new Error('Failed to upload payment proof');
        }

        console.log('Payment proof uploaded successfully:', uploadResult);
      } catch (uploadError) {
        console.error('Error uploading payment proof:', uploadError);
        // Don't fail the entire process, but log the error
        notification.warning({
          message: 'Upload Sebagian Berhasil',
          description: 'Pesanan berhasil dibuat, namun gagal mengupload bukti pembayaran. Silakan hubungi customer service.',
          placement: 'topRight',
          duration: 5,
        });
      }

      // Apply voucher usage if voucher was used
      if (appliedVoucher && discountAmount > 0) {
        try {
          await applyVoucher(
            appliedVoucher.id,
            orderData.user_id,
            order.id,
            discountAmount
          );
          console.log('Voucher applied successfully');
        } catch (voucherError) {
          console.error('Error applying voucher:', voucherError);
          // Don't fail the entire process if voucher application fails
        }
      }

      // Update stock for each product
      if (stockChecks && stockChecks.length > 0) {
        for (const item of stockChecks) {
          if (item.available) {
            try {
              const newStock = item.currentStock - item.jumlah;
              await productsAPI.updateStock(item.product_id, newStock);
              console.log(`Stock updated for product ${item.product_id}: ${item.currentStock} → ${newStock}`);
            } catch (stockError) {
              console.error(`Error updating stock for product ${item.product_id}:`, stockError);
            }
          }
        }
      }

      // Clear cart after successful order creation and stock update
      await clearCart();
      console.log('Cart cleared successfully');

      // Refresh products data
      await fetchProducts();
      console.log('Products data refreshed');

      // Show success notification
      notification.success({
        message: 'Pembayaran Berhasil Disubmit!',
        description: `Nomor Pesanan: ${order.order_number || orderData.order_number}. Bukti pembayaran akan diverifikasi dalam 1x24 jam.`,
        placement: 'topRight',
        duration: 5,
      });
      
      // Navigate to orders page
      navigate('/orders');
      
    } catch (error) {
      console.error('Payment submission error:', error);
      notification.error({
        message: 'Gagal Memproses Pembayaran',
        description: error.message,
        placement: 'topRight',
        duration: 4,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!orderData || !selectedPaymentMethod) {
    return (
      <div className="payment-loading">
        <p>Memuat data pembayaran...</p>
      </div>
    );
  }

  return (
    <div className="payment-container">
       <Header title="Pembayaran" />

        <div className="payment-method-details">
          <div className="payment-method-info">
            <img 
              src={getBankLogo(selectedPaymentMethod.bankCode)} 
              alt={selectedPaymentMethod.name}
              className="bank-logo-badge"
            />
            <div className="bank-info">
              <h4 className="bank-name-title">{selectedPaymentMethod.name}</h4>
              <p className="bank-subtitle">Transfer ke rekening berikut</p>
            </div>
          </div>

          <div className="account-details">
            {/* Account Number */}
            <div className="account-number-card">
              <div className="account-info">
                <div className="account-section">
                  <p className="account-label">Nomor Rekening</p>
                  <p className="account-number">
                    {selectedPaymentMethod.accountNumber}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedPaymentMethod.accountNumber, 'Nomor rekening')}
                  className="copy-button"
                  title="Salin nomor rekening"
                >
                  <Copy className="copy-icon" />
                </button>
              </div>
            </div>

            {/* Account Name */}
            <div className="account-name-card">
              <p className="account-label">Atas Nama</p>
              <p className="account-name-text">{selectedPaymentMethod.accountName}</p>
            </div>
          </div>
        </div>

      {/* Payment Amount */}
      <div className="payment-amount-section">
        <h3>Total Pembayaran</h3>
        <div className="payment-amount-details">
            <div className="amount-row total-row">
              <span className="amount-label">Total:</span>
              <span className="amount-value total-value">
                Rp {Number(finalAmount || totalAmount).toLocaleString()}
              </span>
            </div>
        </div>
      </div>

      {/* Payment Proof Upload */}
      <div className="payment-proof-section">
        <h3>Upload Bukti Pembayaran</h3>
        
        <div className="upload-area">
          {!paymentProofPreview ? (
            <label htmlFor="payment-proof-input" className="upload-label">
              <div className="upload-content">
                <Upload className="upload-icon" />
                <p className="upload-text">
                  Klik untuk upload bukti pembayaran
                </p>
                <p className="upload-note">
                  Format: JPG, PNG, maksimal 5MB
                </p>
              </div>
              <input
                id="payment-proof-input"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="upload-input"
              />
            </label>
          ) : (
            <div className="preview-container">
              <div className="preview-header">
                <h4>Preview</h4>
                <button
                  onClick={removePaymentProof}
                  className="remove-button"
                  title="Hapus bukti pembayaran"
                >
                  <X className="remove-icon" />
                </button>
              </div>
              <div className="preview-image-container">
                <img 
                  src={paymentProofPreview} 
                  alt="Bukti Pembayaran" 
                  className="preview-image"
                />
              </div>
              <div className="file-info">
                <p className="file-name">{paymentProof?.name}</p>
                <p className="file-size">
                  {(paymentProof?.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="upload-instructions">
          <h5>Petunjuk Upload:</h5>
          <ul>
            <li>Pastikan bukti transfer terlihat jelas</li>
            <li>Nominal transfer harus sesuai dengan total pembayaran</li>
            <li>Sertakan nama pengirim dan nomor rekening tujuan</li>
            <li>Bukti pembayaran akan diverifikasi dalam 1x24 jam</li>
          </ul>
        </div>
      </div>

      {/* Submit Button */}
      <div className="payment-submit-section">
        <button
          onClick={handlePaymentSubmit}
          disabled={!paymentProof || isProcessing}
          className={`submit-button ${
            (!paymentProof || isProcessing) 
              ? 'submit-button-disabled' 
              : 'submit-button-enabled'
          }`}
        >
          {isProcessing ? '⏳ Memproses...' : 'Konfirmasi Pembayaran'}
        </button>

        {!paymentProof && (
          <p className="submit-warning">
            * Upload bukti pembayaran untuk melanjutkan
          </p>
        )}
      </div>
    </div>
  );
};

export default Payment;