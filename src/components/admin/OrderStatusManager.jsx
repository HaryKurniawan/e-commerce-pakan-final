import React, { useState, useEffect } from 'react';
import { orderStatusApi } from '../../services/orderStatusApi';
import '../styles/OrderStatusManager.css';

const OrderStatusManager = () => {
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersData, statusesData] = await Promise.all([
        orderStatusApi.fetchOrders(),
        orderStatusApi.fetchStatuses()
      ]);
      setOrders(ordersData);
      setStatuses(statusesData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Gagal memuat data. Silakan refresh halaman.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await orderStatusApi.fetchOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Gagal memuat data pesanan.');
    }
  };

  // Fungsi untuk mengecek apakah status adalah status final (tidak bisa diubah)
  const isFinalStatus = (statusName) => {
    const finalStatuses = ['delivered', 'cancelled', 'selesai', 'dibatalkan', 'terkirim'];
    return finalStatuses.some(status => 
      statusName.toLowerCase().includes(status.toLowerCase())
    );
  };

  // Fungsi untuk mendapatkan nama status berdasarkan ID
  const getStatusName = (statusId) => {
    const status = statuses.find(s => s.id === statusId);
    return status ? status.nama : 'Tidak Diketahui';
  };

  const handleStatusChange = async (orderId, newStatusId, currentStatusId) => {
    const currentStatusName = getStatusName(currentStatusId);
    const newStatusName = getStatusName(newStatusId);

    // Cek apakah status saat ini adalah status final
    if (isFinalStatus(currentStatusName)) {
      alert(`❌ Status pesanan tidak dapat diubah!\n\nPesanan dengan status "${currentStatusName}" sudah final dan tidak dapat dimodifikasi lagi.`);
      return;
    }

    // Konfirmasi perubahan status
    const confirmMessage = `Apakah Anda yakin ingin mengubah status pesanan?\n\nDari: ${currentStatusName}\nKe: ${newStatusName}\n\nPerubahan ini akan mempengaruhi status pesanan customer.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      await orderStatusApi.updateOrderStatus(orderId, newStatusId);
      alert(`✅ Status berhasil diperbarui!\n\nStatus pesanan telah diubah ke: ${newStatusName}`);
      await fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('❌ Gagal mengubah status pesanan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Format alamat lengkap
  const formatAddress = (address) => {
    if (!address) return 'Alamat tidak tersedia';
    
    const { alamat_lengkap, nama_desa, rt, rw, kecamatan, kota_kabupaten, provinsi } = address;
    
    return `${alamat_lengkap}, Desa ${nama_desa}, RT ${rt}/RW ${rw}, Kec. ${kecamatan?.nama || '-'}, ${kota_kabupaten?.nama || '-'}, ${provinsi?.nama || '-'}`;
  };

  // Format nomor telepon
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '-';
    
    // Konversi ke string dan format
    const phone = phoneNumber.toString();
    
    // Jika dimulai dengan 62, format ke +62
    if (phone.startsWith('62')) {
      return `+${phone}`;
    }
    
    // Jika dimulai dengan 08, ganti dengan +628
    if (phone.startsWith('08')) {
      return `+628${phone.substring(2)}`;
    }
    
    return phone;
  };

  // Hitung jumlah orders per status
  const getOrderCountByStatus = (statusId) => {
    return orders.filter(order => order.status_id === statusId).length;
  };

  // Filter orders berdasarkan status dan search query
  const filteredOrders = orders.filter(order => {
    // Filter berdasarkan status
    const statusMatch = filterStatus === 'all' || order.status_id === parseInt(filterStatus);
    
    // Filter berdasarkan search query (case insensitive) - bisa search berdasarkan order number atau nama user
    const searchMatch = searchQuery === '' || 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.users?.nama && order.users.nama.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return statusMatch && searchMatch;
  });

  // Filter status untuk tombol - kecualikan status "Selesai" dan yang serupa
  const getFilterableStatuses = () => {
    return statuses.filter(status => 
      !status.nama.toLowerCase().includes('selesai') &&
      !status.nama.toLowerCase().includes('complete') &&
      !status.nama.toLowerCase().includes('done')
    );
  };

  // Handler untuk clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Handler untuk paste dari clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSearchQuery(text.trim());
    } catch (error) {
      console.error('Gagal mengambil data dari clipboard:', error);
      alert('Gagal mengambil data dari clipboard. Pastikan browser mendukung fitur ini.');
    }
  };

  // Handler untuk refresh data
  const handleRefresh = async () => {
    await loadInitialData();
  };

  if (loading && orders.length === 0) {
    return (
      <div className="admin-orders">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Memuat data pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      {/* Header dengan refresh button */}
      <div className="header-section">
        <h2>Manajemen Status Pesanan</h2>
        <button 
          onClick={handleRefresh}
          className="refresh-btn"
          disabled={loading}
          title="Refresh data"
        >
          🔄 {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Cari berdasarkan No. Pesanan atau Nama Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              onClick={handleClearSearch}
              className="clear-search-btn"
              title="Hapus pencarian"
            >
              ×
            </button>
          )}
        </div>
        <button 
          onClick={handlePaste}
          className="paste-btn"
          title="Paste dari clipboard"
        >
          📋 Paste
        </button>
      </div>

      {/* Filter Status dengan Button */}
      <div className="filter-section">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            Semua Status ({orders.length})
          </button>
          {getFilterableStatuses().map((status) => (
            <button 
              key={status.id}
              className={`filter-btn ${filterStatus === status.id.toString() ? 'active' : ''}`}
              onClick={() => setFilterStatus(status.id.toString())}
            >
              {status.nama} ({getOrderCountByStatus(status.id)})
            </button>
          ))}
        </div>
      </div>

      {/* Order Table */}
      <div className="order-table-wrapper">
        <table className="order-table">
          <thead>
            <tr className='order-th'>
              <th>No. Pesanan</th>
              <th>Nama Customer</th>
              <th>Email</th>
              <th>No. Telepon</th>
              <th>Alamat Pengiriman</th>
              <th>Status Saat Ini</th>
              <th>Ubah Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const currentStatusName = getStatusName(order.status_id);
                const isStatusFinal = isFinalStatus(currentStatusName);
                
                return (
                  <tr key={order.id}>
                    <td className="order-number">{order.order_number}</td>
                    <td className="customer-name">
                      {order.users?.nama || 'Nama tidak tersedia'}
                    </td>
                    <td className="customer-email">
                      {order.users?.email || 'Email tidak tersedia'}
                    </td>
                    <td className="customer-phone">
                      {formatPhoneNumber(order.users?.no_hp)}
                    </td>
                    <td className="shipping-address">
                      <div className="address-container" title={formatAddress(order.user_addresses)}>
                        {formatAddress(order.user_addresses)}
                      </div>
                    </td>
                    <td className="order-status">
                      <span className={isStatusFinal ? 'status-final' : 'status-normal'}>
                        {currentStatusName}
                        {isStatusFinal && ' 🔒'}
                      </span>
                    </td>
                    <td>
                      {isStatusFinal ? (
                        <span className="status-locked" title="Status sudah final, tidak dapat diubah">
                          🔒 Terkunci
                        </span>
                      ) : (
                        <select
                          className="status-select"
                          value={order.status_id}
                          onChange={(e) => handleStatusChange(order.id, parseInt(e.target.value), order.status_id)}
                          disabled={loading}
                        >
                          {statuses.map((status) => (
                            <option key={status.id} value={status.id}>
                              {status.nama}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="no-results">
                  {searchQuery ? 
                    `Tidak ditemukan pesanan dengan kriteria "${searchQuery}"` : 
                    'Tidak ada data pesanan'
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    
    </div>
  );
};

export default OrderStatusManager;