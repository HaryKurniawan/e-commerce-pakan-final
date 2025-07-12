import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/ordersAPI';
import { useAuth } from '../context/AuthContext';
import Header from '../components/common/Header'
import './OrderDetail.css'

const OrderDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    // Check if order data exists in location state
    if (location.state && location.state.order) {
      setOrder(location.state.order);
      setLoading(false);
    } else if (location.state && location.state.orderId) {
      // If only orderId is passed, fetch order from API
      loadOrderFromAPI(location.state.orderId);
    } else {
      // Redirect back to orders if no order data
      navigate('/orders');
    }
  }, [location.state, navigate]);

  const loadOrderFromAPI = async (orderId) => {
    try {
      const orderData = await ordersAPI.getOrderById(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error('Error loading order:', error);
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(order.order_number);
      setCopyMessage('Order ID berhasil disalin!');
      setTimeout(() => setCopyMessage(''), 3000);
    } catch (error) {
      console.error('Error copying order ID:', error);
      setCopyMessage('Gagal menyalin Order ID');
      setTimeout(() => setCopyMessage(''), 3000);
    }
  };

  const getStatusColor = (statusName) => {
    const colors = {
      'pending': '#f59e0b',
      'confirmed': '#3b82f6',
      'processing': '#8b5cf6',
      'shipped': '#06b6d4',
      'delivered': '#10b981',
      'cancelled': '#ef4444'
    };
    return colors[statusName] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="orderdetail-contain">
        <Header title="Detail Pesanan" />
        <div className="order-content">
          <div className="loading-container">
            <p className="loading-text">Memuat detail pesanan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="orderdetail-contain">
        <Header title="Detail Pesanan" />
        <div className="order-content">
          <div className="error-container">
            <p className="error-text">Data pesanan tidak ditemukan</p>
            <button className="back-button" onClick={() => navigate('/orders')}>
              Kembali ke Daftar Pesanan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='orderdetail-contain'>
      <Header title="Detail Pesanan" />
      
      <div className="order-content">
        <div className="order-card">
          {/* Order Header */}
          <div className="order-header">
            <div>
              <h1 className="ordered-number">No. {order.order_number}</h1>
              {copyMessage && (
                <p className="copy-message">{copyMessage}</p>
              )}
            </div>
            <button className="copy-button-order-detail" onClick={copyOrderId}>
              Salin ID
            </button>
          </div>
          
          {/* Order Info */}
          <div className="order-info">
            <p className="order-date">
              📅 {new Date(order.created_at).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            
            <div 
              className="status-badge"
              style={{ backgroundColor: getStatusColor(order.order_status.nama) }}
            >
              {order.order_status.deskripsi}
            </div>
          </div>

          {/* Order Items */}
          <div className="section">
            <h2 className="section-title-order-detail">Item Pesanan</h2>
            {order.order_items.map(item => (
              <div key={item.id} className="order-item">
                <div className="item-content">
                  <div className="item-name">{item.products.nama_produk}</div>
                  <div className="item-details">
                    <span className="item-quantity">
                      {item.quantity || item.jumlah} × Rp {Number(item.price).toLocaleString('id-ID')}
                    </span>
                    <span className="item-subtotal">
                      Rp {Number(item.subtotal).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="dashed-line"></div>

          <div className="section">
            <h2 className="section-title-order-detail">Alamat Pengiriman</h2>
            <div className="address-info">
              <p>{order.user_addresses.alamat_lengkap}
                , {order.user_addresses.nama_desa}, RT {order.user_addresses.rt}/RW {order.user_addresses.rw}
                , {order.user_addresses.kecamatan?.nama}, {order.user_addresses.kota_kabupaten?.nama}
                , {order.user_addresses.provinsi?.nama}
                </p>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="section">
              <h2 className="section-title">Catatan</h2>
              <div className="notes-content">
                {order.notes}
              </div>
            </div>
          )}

          <div className="dashed-line"></div>

          {/* Total */}
          <div className="total-section-order-detail">
              Total: Rp {Number(order.total_amount).toLocaleString('id-ID')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;