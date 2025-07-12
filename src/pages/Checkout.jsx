// components/Checkout.js
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/productsAPI';
import { addressAPI } from '../services/addressAPI';
import { useAuth } from '../context/AuthContext';
import PaymentMethodDropdown from '../components/common/PaymentMethodDropdown'
import './Checkout.css'
import Header from '../components/common/Header'


const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  // Extract data from location state
  const {
    cartItems,
    totalAmount,
    appliedVoucher,
    discountAmount = 0,
    finalAmount
  } = location.state || {};

  // Component state
  const [loading, setLoading] = useState(false);
  const [primaryAddress, setPrimaryAddress] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [orderNotes, setOrderNotes] = useState('');
  const [stockChecks, setStockChecks] = useState([]);
  const [error, setError] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  // Generate order number
  const generateOrderNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `ORD-${year}${month}${day}-${hours}${minutes}${seconds}`;
  };

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      alert('Tidak ada produk untuk di-checkout.');
      navigate('/cart');
      return;
    }

    loadPrimaryAddress();
    checkStockAvailability();
  }, [cartItems, navigate, currentUser]);

  const loadPrimaryAddress = async () => {
    try {
      setLoadingAddress(true);
      const addresses = await addressAPI.getUserAddresses(currentUser.id);
      const primary = addresses.find(addr => addr.is_primary);
      setPrimaryAddress(primary);
    } catch (error) {
      console.error('Error loading primary address:', error);
      setError('Gagal memuat alamat pengiriman');
    } finally {
      setLoadingAddress(false);
    }
  };

  const checkStockAvailability = async () => {
    try {
      const products = await productsAPI.getAll();
      const checks = cartItems.map(item => {
        const product = products.find(p => p.id === item.product_id);
        if (!product) {
          return {
            ...item,
            available: false,
            error: 'Produk tidak ditemukan'
          };
        }
        if (item.jumlah > product.stok) {
          return {
            ...item,
            available: false,
            error: `Stok tidak mencukupi. Tersedia: ${product.stok}`
          };
        }
        return {
          ...item,
          available: true,
          currentStock: product.stok,
          product: product
        };
      });
      setStockChecks(checks);
    } catch (error) {
      console.error('Error checking stock:', error);
      setError('Gagal memeriksa ketersediaan stok');
    }
  };

  const handleCheckout = async () => {
    if (!primaryAddress) {
      alert('Pilih alamat pengiriman terlebih dahulu.');
      return;
    }

    if (!selectedPaymentMethod) {
      alert('Pilih metode pembayaran terlebih dahulu.');
      return;
    }

    // Check if all items are available
    const unavailableItems = stockChecks.filter(item => !item.available);
    if (unavailableItems.length > 0) {
      alert(`Beberapa produk tidak tersedia: ${unavailableItems.map(item => item.error).join(', ')}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate order number
      const orderNumber = generateOrderNumber();

      // Validate and prepare order data
      const orderData = {
        user_id: parseInt(currentUser.id),
        order_number: orderNumber,
        original_amount: parseFloat(totalAmount || 0),
        discount_amount: parseFloat(discountAmount || 0),
        total_amount: parseFloat(finalAmount || totalAmount || 0),
        voucher_id: appliedVoucher?.id ? parseInt(appliedVoucher.id) : null,
        voucher_code: appliedVoucher?.kode_voucher || null,
        shipping_address_id: parseInt(primaryAddress.id),
        notes: orderNotes || null,
        status_id: 1, // Default status (pending)
        payment_method: selectedPaymentMethod.name,
        payment_account: selectedPaymentMethod.accountNumber,
        // Order items with proper data types
        items: cartItems.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.jumlah),
          price: parseFloat(item.products?.harga || 0),
          subtotal: parseFloat(item.products?.harga || 0) * parseInt(item.jumlah)
        }))
      };

      // Validate order data
      if (!orderData.user_id || orderData.user_id <= 0) {
        throw new Error('Invalid user ID');
      }
      if (!orderData.total_amount || orderData.total_amount <= 0) {
        throw new Error('Invalid total amount');
      }
      if (!orderData.shipping_address_id || orderData.shipping_address_id <= 0) {
        throw new Error('Invalid shipping address');
      }
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('No items in order');
      }

      // Validate each item
      for (const item of orderData.items) {
        if (!item.product_id || item.product_id <= 0) {
          throw new Error('Invalid product ID in order items');
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error('Invalid quantity in order items');
        }
        if (!item.price || item.price <= 0) {
          throw new Error('Invalid price in order items');
        }
      }

      console.log('Preparing order data:', orderData);

      // Navigate to payment page with all necessary data
      navigate('/payment', {
        state: {
          orderData,
          cartItems,
          totalAmount,
          appliedVoucher,
          discountAmount,
          finalAmount,
          primaryAddress,
          orderNotes,
          selectedPaymentMethod,
          stockChecks
        }
      });

    } catch (err) {
      console.error('Checkout preparation error:', err);
      setError(err.message || 'Terjadi kesalahan saat memproses checkout');
      alert(`Checkout gagal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingAddress) {
    return (
      <div className="loading-container">
        <p>Memuat data checkout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <button onClick={() => navigate('/cart')}>Kembali ke Keranjang</button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
       <Header title="Checkout" />

      {/* Alamat Pengiriman */}
      <div className="address-section">
        <div className="address-headerr">
          <p>Alamat Pengiriman </p>
          <button 
            onClick={() => navigate('/address')}
            className="manage-address-button"
          >
            Edit 
          </button>
        </div>

        {primaryAddress ? (
          <div className="primary-address-card">
            <div className="address-details">
              <p className="address-detail-item">
                 {primaryAddress.alamat_lengkap}, Rt {primaryAddress.rt}/ Rw {primaryAddress.rw}, {primaryAddress.nama_desa}
                 , {primaryAddress.kecamatan?.nama || 'N/A'}, {primaryAddress.kota_kabupaten?.nama || 'N/A'}, {primaryAddress.provinsi?.nama || 'N/A'}
              </p>
          
              {primaryAddress.catatan_alamat && (
                <p className="address-note">
                  <strong>Catatan:</strong> {primaryAddress.catatan_alamat}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="no-address-warning">
            <p className="warning-text">
              ⚠️ Belum ada alamat pengiriman yang dipilih
            </p>
            <button 
              onClick={() => navigate('/address')}
              className="add-address-button"
            >
              + Tambah Alamat
            </button>
          </div>
        )}
      </div>

      <div className="dashed-line"></div>

      {/* Detail Pesanan */}
      <div className="order-details-section">
        
        {cartItems?.map((item, index) => {
          const stockCheck = stockChecks.find(check => check.product_id === item.product_id);
          return (
            <div key={`${item.product_id}-${index}`} className="order-item">
              <div className="order-item-details">
                <p className="order-item-name">
                  {item.products?.nama_produk}
                  {stockCheck && !stockCheck.available && (
                    <span className="stock-warning"> ⚠️ {stockCheck.error}</span>
                  )}
                </p>
                <p className="order-item-quantity">
                  Jumlah: {item.jumlah} × Rp {Number(item.products?.harga || 0).toLocaleString()}
                </p>
              </div>
              <div className="order-item-price">
                <strong className="order-item-total">
                  Rp {(Number(item.products?.harga || 0) * item.jumlah).toLocaleString()}
                </strong>
              </div>
            </div>
          );
        })}

      <div className="dashed-line"></div>

      {/* Voucher Section */}
      {appliedVoucher && discountAmount > 0 && (
        <div className="applied-voucher-section">
          <h4>🎟️ Voucher Diterapkan</h4>
          <div className="voucher-details">
            <div className="voucher-info">
              <p><strong>Nama:</strong> {appliedVoucher.nama_voucher}</p>
              <p><strong>Kode:</strong> {appliedVoucher.kode_voucher}</p>
              <p><strong>Deskripsi:</strong> {appliedVoucher.deskripsi}</p>
            </div>
            <div className="voucher-discount">
              <p><strong>Diskon:</strong> -Rp {Number(discountAmount).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
      </div>

      <div className="section-divider" />

      <div className="order-summary-section">
        <div className="summary-row">
          <span className="summary-label">Subtotal:</span>
          <span className="summary-value">
            Rp {Number(totalAmount).toLocaleString()}
          </span>
        </div>



        {appliedVoucher && discountAmount > 0 && (
          <div className="summary-row discount-row">
            <span className="summary-label">
              Diskon ({appliedVoucher.kode_voucher}):
            </span>
            <span className="summary-value discount-value">
              -Rp {Number(discountAmount).toLocaleString()}
            </span>
          </div>
        )}

        <div className="summary-row total-row">
          <span className="summary-label">Total:</span>
          <span className="summary-value total-value">
            Rp {Number(finalAmount || totalAmount).toLocaleString()}
          </span>
        </div>

        {/* {appliedVoucher && discountAmount > 0 && (
          <div className="savings-notice">
            <p>🎉 Anda menghemat Rp {Number(discountAmount).toLocaleString()}!</p>
          </div>
        )} */}
      </div>

      <div className="dashed-line"></div>

      <PaymentMethodDropdown onPaymentSelect={setSelectedPaymentMethod} />


      <div className="checkout-action-section">

        <div className="teks-total">
          Total: <br /> Rp {Number(finalAmount || totalAmount).toLocaleString()}
        </div>
        
        <button
          onClick={handleCheckout}
          disabled={loading || !primaryAddress || !selectedPaymentMethod || stockChecks.some(item => !item.available)}
          className={`checkout-button ${
            (!primaryAddress || !selectedPaymentMethod || loading || stockChecks.some(item => !item.available))
              ? 'checkout-button-disabled'
              : 'checkout-button-enabled'
          }`}
        >
          {loading ? '⏳ Memproses...' : 'Ke Pembayaran'}
        </button>

      </div>
    </div>
  );
};

export default Checkout;