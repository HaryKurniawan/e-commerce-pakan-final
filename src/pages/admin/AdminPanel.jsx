import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ navigate
import { Modal } from 'antd'; // ✅ modal konfirmasi
import { useAuth } from '../../context/AuthContext'; // ✅ auth context
import { useProducts } from '../../hooks/useProducts';

import ProductForm from '../../components/admin/ProductForm';
import AdminProductList from '../../components/admin/AdminProductList';
import OrderStatusManager from '../../components/admin/OrderStatusManager';
import LocationManagerrr from '../../components/admin/LocationManagerrr';
import VoucherManager from '../../components/admin/VoucherManager';
import './admin.css';

const AdminPanel = () => {
  const { products, createProduct, updateProduct, deleteProduct, loading, fetchProducts } = useProducts();
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'products', label: 'Kelola Produk', icon: '📦' },
    { id: 'locations', label: 'Kelola Lokasi', icon: '📍' },
    { id: 'orders', label: 'Status Pesanan', icon: '📋' },
    { id: 'vouchers', label: 'Kelola Voucher', icon: '🎫' },
  ];

  const handleLogout = () => {
    Modal.confirm({
      title: 'Konfirmasi Logout',
      content: 'Apakah Anda yakin ingin logout?',
      okText: 'Ya',
      cancelText: 'Batal',
      onOk() {
        logout();
        navigate('/');
      },
    });
  };

  const handleProductSubmit = async (productData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        alert('Produk berhasil diperbarui!');
        setEditingProduct(null);
      } else {
        await createProduct(productData);
        alert('Produk berhasil ditambahkan!');
      }

      if (fetchProducts) {
        await fetchProducts();
      }
    } catch (error) {
      alert('Gagal menyimpan produk: ' + error.message);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        await deleteProduct(productId);
        alert('Produk berhasil dihapus!');
        if (fetchProducts) await fetchProducts();
      }
    } catch (error) {
      alert('Gagal menghapus produk: ' + error.message);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return (
          <div className="admin-content">
            <div className="content-header">
              <h2>Kelola Produk</h2>
              <p>Tambah, edit, dan hapus produk yang tersedia</p>
            </div>
            <ProductForm
              onSubmit={handleProductSubmit}
              editingProduct={editingProduct}
              onCancelEdit={handleCancelEdit}
              loading={loading}
            />
            <AdminProductList
              products={products}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
            />
          </div>
        );
      case 'locations':
        return (
          <div className="admin-content">
            <div className="content-header">
              <h2>Kelola Lokasi</h2>
              <p>Atur lokasi pengiriman dan wilayah layanan</p>
            </div>
            <LocationManagerrr />
          </div>
        );
      case 'orders':
        return (
          <div className="admin-content">
            <div className="content-header">
              <h2>Status Pesanan</h2>
              <p>Kelola dan update status pesanan pelanggan</p>
            </div>
            <OrderStatusManager />
          </div>
        );
      case 'vouchers':
        return (
          <div className="admin-content">
            <div className="content-header">
              <h2>Kelola Voucher</h2>
              <p>Buat dan kelola voucher diskon untuk pelanggan</p>
            </div>
            <VoucherManager />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modern-admin-panel">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h3>Admin Panel</h3>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminPanel;