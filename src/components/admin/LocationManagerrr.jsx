import React, { useState, useEffect } from 'react';
import { addressAPI } from '../../services/addressAPI';
import { locationAPI } from '../../services/locationAPI';

import '../styles/adminLocation.css'

const LocationManagerrr = () => {
  const [activeTab, setActiveTab] = useState('provinsi');
  const [provinsiList, setProvinsiList] = useState([]);
  const [kotaList, setKotaList] = useState([]);
  const [kecamatanList, setKecamatanList] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form states - removed tipe from kotaForm
  const [provinsiForm, setProvinsiForm] = useState({ nama: '' });
  const [kotaForm, setKotaForm] = useState({ nama: '', provinsi_id: '' });
  const [kecamatanForm, setKecamatanForm] = useState({ nama: '', kota_kabupaten_id: '' });
  
  // Edit states
  const [editingProvinsi, setEditingProvinsi] = useState(null);
  const [editingKota, setEditingKota] = useState(null);
  const [editingKecamatan, setEditingKecamatan] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'provinsi') {
        const data = await locationAPI.getAllProvinsi();
        setProvinsiList(data);
      } else if (activeTab === 'kota') {
        const [provinsiData, kotaData] = await Promise.all([
          addressAPI.getProvinsi(),
          locationAPI.getAllKotaKabupaten()
        ]);
        setProvinsiList(provinsiData);
        setKotaList(kotaData);
      } else if (activeTab === 'kecamatan') {
        const [provinsiData, kotaData, kecamatanData] = await Promise.all([
          addressAPI.getProvinsi(),
          locationAPI.getAllKotaKabupaten(),
          locationAPI.getAllKecamatan()
        ]);
        setProvinsiList(provinsiData);
        setKotaList(kotaData);
        setKecamatanList(kecamatanData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Gagal memuat data: ' + error.message);
    }
    setLoading(false);
  };

  // Provinsi handlers
  const handleProvinsiSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProvinsi) {
        await locationAPI.updateProvinsi(editingProvinsi.id, provinsiForm);
        alert('Provinsi berhasil diperbarui!');
        setEditingProvinsi(null);
      } else {
        await locationAPI.createProvinsi(provinsiForm);
        alert('Provinsi berhasil ditambahkan!');
      }
      setProvinsiForm({ nama: '' });
      loadData();
    } catch (error) {
      alert('Gagal menyimpan provinsi: ' + error.message);
    }
  };

  const handleEditProvinsi = (provinsi) => {
    setEditingProvinsi(provinsi);
    setProvinsiForm({ nama: provinsi.nama });
  };

  const handleDeleteProvinsi = async (provinsiId) => {
    if (confirm('Apakah Anda yakin ingin menghapus provinsi ini?')) {
      try {
        await locationAPI.deleteProvinsi(provinsiId);
        alert('Provinsi berhasil dihapus!');
        loadData();
      } catch (error) {
        alert('Gagal menghapus provinsi: ' + error.message);
      }
    }
  };

  // Kota handlers - removed tipe handling
  const handleKotaSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingKota) {
        await locationAPI.updateKotaKabupaten(editingKota.id, kotaForm);
        alert('Kota/Kabupaten berhasil diperbarui!');
        setEditingKota(null);
      } else {
        await locationAPI.createKotaKabupaten(kotaForm);
        alert('Kota/Kabupaten berhasil ditambahkan!');
      }
      setKotaForm({ nama: '', provinsi_id: '' });
      loadData();
    } catch (error) {
      alert('Gagal menyimpan kota/kabupaten: ' + error.message);
    }
  };

  const handleEditKota = (kota) => {
    setEditingKota(kota);
    setKotaForm({ 
      nama: kota.nama, 
      provinsi_id: kota.provinsi_id 
    });
  };

  const handleDeleteKota = async (kotaId) => {
    if (confirm('Apakah Anda yakin ingin menghapus kota/kabupaten ini?')) {
      try {
        await locationAPI.deleteKotaKabupaten(kotaId);
        alert('Kota/Kabupaten berhasil dihapus!');
        loadData();
      } catch (error) {
        alert('Gagal menghapus kota/kabupaten: ' + error.message);
      }
    }
  };

  // Kecamatan handlers
  const handleKecamatanSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingKecamatan) {
        await locationAPI.updateKecamatan(editingKecamatan.id, kecamatanForm);
        alert('Kecamatan berhasil diperbarui!');
        setEditingKecamatan(null);
      } else {
        await locationAPI.createKecamatan(kecamatanForm);
        alert('Kecamatan berhasil ditambahkan!');
      }
      setKecamatanForm({ nama: '', kota_kabupaten_id: '' });
      loadData();
    } catch (error) {
      alert('Gagal menyimpan kecamatan: ' + error.message);
    }
  };

  const handleEditKecamatan = (kecamatan) => {
    setEditingKecamatan(kecamatan);
    setKecamatanForm({ 
      nama: kecamatan.nama, 
      kota_kabupaten_id: kecamatan.kota_kabupaten_id 
    });
  };

  const handleDeleteKecamatan = async (kecamatanId) => {
    if (confirm('Apakah Anda yakin ingin menghapus kecamatan ini?')) {
      try {
        await locationAPI.deleteKecamatan(kecamatanId);
        alert('Kecamatan berhasil dihapus!');
        loadData();
      } catch (error) {
        alert('Gagal menghapus kecamatan: ' + error.message);
      }
    }
  };

  const cancelEdit = () => {
    setEditingProvinsi(null);
    setEditingKota(null);
    setEditingKecamatan(null);
    setProvinsiForm({ nama: '' });
    setKotaForm({ nama: '', provinsi_id: '' });
    setKecamatanForm({ nama: '', kota_kabupaten_id: '' });
  };

  if (loading) {
    return <div className="loading">Memuat data...</div>;
  }

  return (
    <div className="location-manager">
      <div className="tab-navigation">
        <button 
          className={activeTab === 'provinsi' ? 'active' : ''}
          onClick={() => setActiveTab('provinsi')}
        >
          Provinsi
        </button>
        <button 
          className={activeTab === 'kota' ? 'active' : ''}
          onClick={() => setActiveTab('kota')}
        >
          Kota/Kabupaten
        </button>
        <button 
          className={activeTab === 'kecamatan' ? 'active' : ''}
          onClick={() => setActiveTab('kecamatan')}
        >
          Kecamatan
        </button>
      </div>

      {/* Provinsi Tab */}
      {activeTab === 'provinsi' && (
        <div className="tab-content">
          <div className="form-section">
            <h3>{editingProvinsi ? 'Edit Provinsi' : 'Tambah Provinsi'}</h3>
            <form onSubmit={handleProvinsiSubmit}>
              <div className="form-group">
                <label>Nama Provinsi:</label>
                <input
                  type="text"
                  value={provinsiForm.nama}
                  onChange={(e) => setProvinsiForm({ nama: e.target.value })}
                  required
                />
              </div>
              <div className="form-buttons">
                <button type="submit">
                  {editingProvinsi ? 'Update' : 'Tambah'}
                </button>
                {editingProvinsi && (
                  <button type="button" onClick={cancelEdit}>
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="list-section">
            <h3>Daftar Provinsi</h3>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {provinsiList.map((provinsi) => (
                  <tr key={provinsi.id}>
                    <td>{provinsi.id}</td>
                    <td>{provinsi.nama}</td>
                    <td>
                      <button onClick={() => handleEditProvinsi(provinsi)}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteProvinsi(provinsi.id)}>
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kota/Kabupaten Tab - removed tipe field and column */}
      {activeTab === 'kota' && (
        <div className="tab-content">
          <div className="form-section">
            <h3>{editingKota ? 'Edit Kota/Kabupaten' : 'Tambah Kota/Kabupaten'}</h3>
            <form onSubmit={handleKotaSubmit}>
              <div className="form-group">
                <label>Provinsi:</label>
                <select
                  value={kotaForm.provinsi_id}
                  onChange={(e) => setKotaForm({ ...kotaForm, provinsi_id: e.target.value })}
                  required
                >
                  <option value="">Pilih Provinsi</option>
                  {provinsiList.map((provinsi) => (
                    <option key={provinsi.id} value={provinsi.id}>
                      {provinsi.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Nama:</label>
                <input
                  type="text"
                  value={kotaForm.nama}
                  onChange={(e) => setKotaForm({ ...kotaForm, nama: e.target.value })}
                  required
                />
              </div>
              <div className="form-buttons">
                <button type="submit">
                  {editingKota ? 'Update' : 'Tambah'}
                </button>
                {editingKota && (
                  <button type="button" onClick={cancelEdit}>
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="list-section">
            <h3>Daftar Kota/Kabupaten</h3>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama</th>
                  <th>Provinsi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kotaList.map((kota) => (
                  <tr key={kota.id}>
                    <td>{kota.id}</td>
                    <td>{kota.nama}</td>
                    <td>{kota.provinsi?.nama}</td>
                    <td>
                      <button onClick={() => handleEditKota(kota)}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteKota(kota.id)}>
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kecamatan Tab */}
      {activeTab === 'kecamatan' && (
        <div className="tab-content">
          <div className="form-section">
            <h3>{editingKecamatan ? 'Edit Kecamatan' : 'Tambah Kecamatan'}</h3>
            <form onSubmit={handleKecamatanSubmit}>
              <div className="form-group">
                <label>Kota/Kabupaten:</label>
                <select
                  value={kecamatanForm.kota_kabupaten_id}
                  onChange={(e) => setKecamatanForm({ ...kecamatanForm, kota_kabupaten_id: e.target.value })}
                  required
                >
                  <option value="">Pilih Kota/Kabupaten</option>
                  {kotaList.map((kota) => (
                    <option key={kota.id} value={kota.id}>
                      {kota.nama} ({kota.provinsi?.nama})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Nama Kecamatan:</label>
                <input
                  type="text"
                  value={kecamatanForm.nama}
                  onChange={(e) => setKecamatanForm({ ...kecamatanForm, nama: e.target.value })}
                  required
                />
              </div>
              <div className="form-buttons">
                <button type="submit">
                  {editingKecamatan ? 'Update' : 'Tambah'}
                </button>
                {editingKecamatan && (
                  <button type="button" onClick={cancelEdit}>
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="list-section">
            <h3>Daftar Kecamatan</h3>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama</th>
                  <th>Kota/Kabupaten</th>
                  <th>Provinsi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kecamatanList.map((kecamatan) => (
                  <tr key={kecamatan.id}>
                    <td>{kecamatan.id}</td>
                    <td>{kecamatan.nama}</td>
                    <td>{kecamatan.kota_kabupaten?.nama}</td>
                    <td>{kecamatan.kota_kabupaten?.provinsi?.nama}</td>
                    <td>
                      <button onClick={() => handleEditKecamatan(kecamatan)}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteKecamatan(kecamatan.id)}>
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationManagerrr;