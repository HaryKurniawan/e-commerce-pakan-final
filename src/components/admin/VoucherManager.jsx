import React, { useState, useEffect } from 'react';
import { voucherAPI } from '../../services/voucherAPI';

const VoucherManager = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [voucherUsage, setVoucherUsage] = useState([]);
  const [stats, setStats] = useState({});

  const [formData, setFormData] = useState({
    kode_voucher: '',
    nama_voucher: '',
    deskripsi: '',
    tipe_diskon: 'PERCENTAGE',
    nilai_diskon: '',
    minimal_pembelian: '',
    maksimal_diskon: '',
    maksimal_penggunaan: '',
    tanggal_mulai: '',
    tanggal_berakhir: '',
    status: true
  });

  useEffect(() => {
    fetchVouchers();
    fetchStats();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const data = await voucherAPI.getAllVouchers();
      setVouchers(data);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      alert('Gagal mengambil data voucher');
    } finally {
      setLoading(false);
    }
  };

  const fetchVoucherUsage = async () => {
    try {
      setLoading(true);
      const data = await voucherAPI.getVoucherUsage();
      setVoucherUsage(data);
    } catch (error) {
      console.error('Error fetching voucher usage:', error);
      alert('Gagal mengambil data penggunaan voucher');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await voucherAPI.getVoucherStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validasi form
      if (!formData.kode_voucher || !formData.nama_voucher || !formData.nilai_diskon) {
        alert('Mohon lengkapi semua field yang wajib diisi');
        return;
      }

      // Validasi tanggal
      const tanggalMulai = new Date(formData.tanggal_mulai);
      const tanggalBerakhir = new Date(formData.tanggal_berakhir);
      
      if (tanggalBerakhir <= tanggalMulai) {
        alert('Tanggal berakhir harus setelah tanggal mulai');
        return;
      }

      const voucherData = {
        ...formData,
        created_by: 1 // Assuming admin user ID is 1, adjust as needed
      };

      if (editingVoucher) {
        await voucherAPI.updateVoucher(editingVoucher.id, voucherData);
        alert('Voucher berhasil diperbarui!');
      } else {
        await voucherAPI.createVoucher(voucherData);
        alert('Voucher berhasil ditambahkan!');
      }

      // Reset form
      setFormData({
        kode_voucher: '',
        nama_voucher: '',
        deskripsi: '',
        tipe_diskon: 'PERCENTAGE',
        nilai_diskon: '',
        minimal_pembelian: '',
        maksimal_diskon: '',
        maksimal_penggunaan: '',
        tanggal_mulai: '',
        tanggal_berakhir: '',
        status: true
      });
      
      setEditingVoucher(null);
      setShowForm(false);
      fetchVouchers();
      fetchStats();

    } catch (error) {
      console.error('Error saving voucher:', error);
      alert('Gagal menyimpan voucher: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      kode_voucher: voucher.kode_voucher,
      nama_voucher: voucher.nama_voucher,
      deskripsi: voucher.deskripsi || '',
      tipe_diskon: voucher.tipe_diskon,
      nilai_diskon: voucher.nilai_diskon.toString(),
      minimal_pembelian: voucher.minimal_pembelian.toString(),
      maksimal_diskon: voucher.maksimal_diskon ? voucher.maksimal_diskon.toString() : '',
      maksimal_penggunaan: voucher.maksimal_penggunaan.toString(),
      tanggal_mulai: voucher.tanggal_mulai.split('T')[0],
      tanggal_berakhir: voucher.tanggal_berakhir.split('T')[0],
      status: voucher.status
    });
    setShowForm(true);
  };

  const handleDelete = async (voucherId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus voucher ini?')) return;

    try {
      setLoading(true);
      await voucherAPI.deleteVoucher(voucherId);
      alert('Voucher berhasil dihapus!');
      fetchVouchers();
      fetchStats();
    } catch (error) {
      console.error('Error deleting voucher:', error);
      alert('Gagal menghapus voucher: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (voucherId, currentStatus) => {
    try {
      setLoading(true);
      await voucherAPI.toggleVoucherStatus(voucherId, !currentStatus);
      alert(`Voucher berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}!`);
      fetchVouchers();
      fetchStats();
    } catch (error) {
      console.error('Error toggling voucher status:', error);
      alert('Gagal mengubah status voucher');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isVoucherActive = (voucher) => {
    const now = new Date();
    const start = new Date(voucher.tanggal_mulai);
    const end = new Date(voucher.tanggal_berakhir);
    return voucher.status && now >= start && now <= end;
  };

  return (
    <div className="voucher-manager">
      <div className="voucher-header">
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
        >
          {showForm ? 'Tutup Form' : 'Tambah Voucher'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Daftar Voucher
        </button>
        <button 
          className={`tab-btn ${activeTab === 'usage' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('usage');
            fetchVoucherUsage();
          }}
        >
          Riwayat Penggunaan
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistik
        </button>
      </div>

      {/* Voucher Form */}
      {showForm && (
        <div className="voucher-form">
          <h3>{editingVoucher ? 'Edit Voucher' : 'Tambah Voucher Baru'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Kode Voucher *</label>
                <input
                  type="text"
                  name="kode_voucher"
                  value={formData.kode_voucher}
                  onChange={handleInputChange}
                  required
                  placeholder="Contoh: WELCOME10"
                />
              </div>
              <div className="form-group">
                <label>Nama Voucher *</label>
                <input
                  type="text"
                  name="nama_voucher"
                  value={formData.nama_voucher}
                  onChange={handleInputChange}
                  required
                  placeholder="Contoh: Voucher Selamat Datang"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Deskripsi</label>
              <textarea
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleInputChange}
                placeholder="Deskripsi voucher..."
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tipe Diskon *</label>
                <select
                  name="tipe_diskon"
                  value={formData.tipe_diskon}
                  onChange={handleInputChange}
                  required
                >
                  <option value="PERCENTAGE">Persentase (%)</option>
                  <option value="FIXED">Nominal Tetap (Rp)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nilai Diskon *</label>
                <input
                  type="number"
                  name="nilai_diskon"
                  value={formData.nilai_diskon}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder={formData.tipe_diskon === 'PERCENTAGE' ? 'Contoh: 10' : 'Contoh: 50000'}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Minimal Pembelian</label>
                <input
                  type="number"
                  name="minimal_pembelian"
                  value={formData.minimal_pembelian}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="0"
                />
              </div>
              {formData.tipe_diskon === 'PERCENTAGE' && (
                <div className="form-group">
                  <label>Maksimal Diskon</label>
                  <input
                    type="number"
                    name="maksimal_diskon"
                    value={formData.maksimal_diskon}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Contoh: 100000"
                  />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Maksimal Penggunaan *</label>
                <input
                  type="number"
                  name="maksimal_penggunaan"
                  value={formData.maksimal_penggunaan}
                  onChange={handleInputChange}
                  required
                  min="1"
                  placeholder="Contoh: 100"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    name="status"
                    checked={formData.status}
                    onChange={handleInputChange}
                  />
                  <span>Aktif</span>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tanggal Mulai *</label>
                <input
                  type="date"
                  name="tanggal_mulai"
                  value={formData.tanggal_mulai}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tanggal Berakhir *</label>
                <input
                  type="date"
                  name="tanggal_berakhir"
                  value={formData.tanggal_berakhir}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Menyimpan...' : editingVoucher ? 'Update Voucher' : 'Simpan Voucher'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingVoucher(null);
                  setFormData({
                    kode_voucher: '',
                    nama_voucher: '',
                    deskripsi: '',
                    tipe_diskon: 'PERCENTAGE',
                    nilai_diskon: '',
                    minimal_pembelian: '',
                    maksimal_diskon: '',
                    maksimal_penggunaan: '',
                    tanggal_mulai: '',
                    tanggal_berakhir: '',
                    status: true
                  });
                }}
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'list' && (
        <div className="voucher-list">
          <h3>Daftar Voucher ({vouchers.length})</h3>
          {loading ? (
            <div className="loading">Memuat data...</div>
          ) : vouchers.length === 0 ? (
            <div className="no-data">Belum ada voucher yang dibuat</div>
          ) : (
            <div className="voucher-grid">
              {vouchers.map(voucher => (
                <div key={voucher.id} className={`voucher-card ${isVoucherActive(voucher) ? 'active' : 'inactive'}`}>
                  <div className="voucher-header">
                    <h4>{voucher.kode_voucher}</h4>
                    <div className="voucher-status">
                      <span className={`status-badge ${voucher.status ? 'active' : 'inactive'}`}>
                        {voucher.status ? 'Aktif' : 'Nonaktif'}
                      </span>
                      {isVoucherActive(voucher) && (
                        <span className="status-badge available">Berlaku</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="voucher-info">
                    <h5>{voucher.nama_voucher}</h5>
                    {voucher.deskripsi && <p className="description">{voucher.deskripsi}</p>}
                    
                    <div className="voucher-details">
                      <div className="detail-item">
                        <span className="label">Diskon:</span>
                        <span className="value">
                          {voucher.tipe_diskon === 'PERCENTAGE' 
                            ? `${voucher.nilai_diskon}%` 
                            : formatCurrency(voucher.nilai_diskon)
                          }
                          {voucher.tipe_diskon === 'PERCENTAGE' && voucher.maksimal_diskon && 
                            ` (max ${formatCurrency(voucher.maksimal_diskon)})`
                          }
                        </span>
                      </div>
                      
                      <div className="detail-item">
                        <span className="label">Min. Pembelian:</span>
                        <span className="value">{formatCurrency(voucher.minimal_pembelian)}</span>
                      </div>
                      
                      <div className="detail-item">
                        <span className="label">Penggunaan:</span>
                        <span className="value">{voucher.jumlah_terpakai} / {voucher.maksimal_penggunaan}</span>
                      </div>
                      
                      <div className="detail-item">
                        <span className="label">Periode:</span>
                        <span className="value">
                          {formatDate(voucher.tanggal_mulai)} - {formatDate(voucher.tanggal_berakhir)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="voucher-actions">
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(voucher)}
                    >
                      Edit
                    </button>
                    <button 
                      className={`btn btn-sm ${voucher.status ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => handleToggleStatus(voucher.id, voucher.status)}
                    >
                      {voucher.status ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(voucher.id)}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="voucher-usage">
          <h3>Riwayat Penggunaan Voucher</h3>
          {loading ? (
            <div className="loading">Memuat data...</div>
          ) : voucherUsage.length === 0 ? (
            <div className="no-data">Belum ada riwayat penggunaan voucher</div>
          ) : (
            <div className="usage-table">
              <table>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Kode Voucher</th>
                    <th>Nama Voucher</th>
                    <th>Pengguna</th>
                    <th>Order ID</th>
                    <th>Diskon</th>
                  </tr>
                </thead>
                <tbody>
                  {voucherUsage.map(usage => (
                    <tr key={usage.id}>
                      <td>{formatDate(usage.tanggal_digunakan)}</td>
                      <td>{usage.vouchers?.kode_voucher}</td>
                      <td>{usage.vouchers?.nama_voucher}</td>
                      <td>{usage.users?.username}</td>
                      <td>#{usage.orders?.id}</td>
                      <td>{formatCurrency(usage.nilai_diskon_digunakan)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="voucher-stats">
          <h3>Statistik Voucher</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Total Voucher</h4>
              <div className="stat-value">{stats.totalVouchers || 0}</div>
            </div>
            <div className="stat-card">
              <h4>Voucher Aktif</h4>
              <div className="stat-value">{stats.activeVouchers || 0}</div>
            </div>
            <div className="stat-card">
              <h4>Total Penggunaan</h4>
              <div className="stat-value">{stats.totalUsage || 0}</div>
            </div>
            <div className="stat-card">
              <h4>Total Diskon Diberikan</h4>
              <div className="stat-value">{formatCurrency(stats.totalDiscountGiven || 0)}</div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .voucher-manager {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .voucher-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e0e0e0;
        }

        .voucher-header h2 {
          color: #333;
          margin: 0;
        }

        .tab-navigation {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 1px solid #ddd;
        }

        .tab-btn {
          padding: 10px 20px;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .tab-btn:hover {
          background-color: #f5f5f5;
        }

        .tab-btn.active {
          border-bottom-color: #007bff;
          color: #007bff;
        }

        .voucher-form {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border: 1px solid #e0e0e0;
        }

        .voucher-form h3 {
          margin-top: 0;
          color: #333;
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-weight: 500;
          margin-bottom: 5px;
          color: #555;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.3s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #545b62;
        }

        .btn-success {
          background-color: #28a745;
          color: white;
        }

        .btn-success:hover {
          background-color: #218838;
        }

        .btn-warning {
          background-color: #ffc107;
          color: #212529;
        }

        .btn-warning:hover {
          background-color: #e0a800;
        }

        .btn-danger {
          background-color: #dc3545;
          color: white;
        }

        .btn-danger:hover {
          background-color: #c82333;
        }

        .btn-sm {
          padding: 5px 10px;
          font-size: 12px;
        }

        .voucher-list h3 {
          margin-bottom: 20px;
          color: #333;
        }

        .voucher-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .voucher-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .voucher-card:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        .voucher-card.active {
          border-left: 4px solid #28a745;
        }

        .voucher-card.inactive {
          border-left: 4px solid #dc3545;
          opacity: 0.8;
        }

        .voucher-card .voucher-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }

        .voucher-card .voucher-header h4 {
          margin: 0;
          color: #007bff;
          font-weight: 600;
        }

        .voucher-status {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .status-badge {
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          text-align: center;
        }

        .status-badge.active {
          background-color: #d4edda;
          color: #155724;
        }

        .status-badge.inactive {
          background-color: #f8d7da;
          color: #721c24;
        }

        .status-badge.available {
          background-color: #d1ecf1;
          color: #0c5460;
        }

        .voucher-info h5 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .description {
          color: #666;
          font-size: 14px;
          margin-bottom: 15px;
          line-height: 1.4;
        }

        .voucher-details {
          margin-bottom: 15px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .detail-item .label {
          color: #666;
          font-weight: 500;
        }

        .detail-item .value {
          color: #333;
          font-weight: 600;
        }

        .voucher-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .usage-table {
          overflow-x: auto;
        }

        .usage-table table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .usage-table th,
        .usage-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .usage-table th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #333;
        }

        .usage-table tr:hover {
          background-color: #f8f9fa;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          text-align: center;
          border-left: 4px solid #007bff;
        }

        .stat-card h4 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 14px;
          font-weight: 500;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #007bff;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .no-data {
          text-align: center;
          padding: 40px;
          color: #666;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px dashed #ddd;
        }

        @media (max-width: 768px) {
          .voucher-manager {
            padding: 15px;
          }

          .voucher-header {
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .voucher-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .tab-navigation {
            flex-wrap: wrap;
          }

          .usage-table {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default VoucherManager;