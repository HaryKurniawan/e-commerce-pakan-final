import { api } from './baseApi.js';

export const locationAPI = {
  // Province CRUD
  getAllProvinsi: async () => {
    const response = await api.get('/provinsi?select=*&order=nama.asc');
    return response.data;
  },

  createProvinsi: async (provinsiData) => {
    const response = await api.post('/provinsi', {
      nama: provinsiData.nama
    });
    return response.data[0];
  },

  updateProvinsi: async (provinsiId, provinsiData) => {
    const response = await api.patch(`/provinsi?id=eq.${provinsiId}`, {
      nama: provinsiData.nama,
      updated_at: new Date().toISOString()
    });
    return response.data[0];
  },

  deleteProvinsi: async (provinsiId) => {
    // Check if provinsi has related data
    const kotaCheck = await api.get(`/kota_kabupaten?provinsi_id=eq.${provinsiId}&select=id`);
    if (kotaCheck.data.length > 0) {
      throw new Error('Tidak dapat menghapus provinsi yang masih memiliki kota/kabupaten');
    }
    
    await api.delete(`/provinsi?id=eq.${provinsiId}`);
  },

  // Kota/Kabupaten CRUD - removed tipe field
  getAllKotaKabupaten: async () => {
    const response = await api.get('/kota_kabupaten?select=*,provinsi(nama)&order=nama.asc');
    return response.data;
  },

  createKotaKabupaten: async (kotaData) => {
    const response = await api.post('/kota_kabupaten', {
      nama: kotaData.nama,
      provinsi_id: kotaData.provinsi_id
    });
    return response.data[0];
  },

  updateKotaKabupaten: async (kotaId, kotaData) => {
    const response = await api.patch(`/kota_kabupaten?id=eq.${kotaId}`, {
      nama: kotaData.nama,
      provinsi_id: kotaData.provinsi_id,
      updated_at: new Date().toISOString()
    });
    return response.data[0];
  },

  deleteKotaKabupaten: async (kotaId) => {
    // Check if kota has related data
    const kecamatanCheck = await api.get(`/kecamatan?kota_kabupaten_id=eq.${kotaId}&select=id`);
    if (kecamatanCheck.data.length > 0) {
      throw new Error('Tidak dapat menghapus kota/kabupaten yang masih memiliki kecamatan');
    }
    
    await api.delete(`/kota_kabupaten?id=eq.${kotaId}`);
  },

  // Kecamatan CRUD
  getAllKecamatan: async () => {
    const response = await api.get('/kecamatan?select=*,kota_kabupaten(nama,provinsi(nama))&order=nama.asc');
    return response.data;
  },

  createKecamatan: async (kecamatanData) => {
    const response = await api.post('/kecamatan', {
      nama: kecamatanData.nama,
      kota_kabupaten_id: kecamatanData.kota_kabupaten_id
    });
    return response.data[0];
  },

  updateKecamatan: async (kecamatanId, kecamatanData) => {
    const response = await api.patch(`/kecamatan?id=eq.${kecamatanId}`, {
      nama: kecamatanData.nama,
      kota_kabupaten_id: kecamatanData.kota_kabupaten_id,
      updated_at: new Date().toISOString()
    });
    return response.data[0];
  },

  deleteKecamatan: async (kecamatanId) => {
    // Check if kecamatan has related data
    const addressCheck = await api.get(`/user_addresses?kecamatan_id=eq.${kecamatanId}&select=id`);
    if (addressCheck.data.length > 0) {
      throw new Error('Tidak dapat menghapus kecamatan yang masih digunakan dalam alamat user');
    }
    
    await api.delete(`/kecamatan?id=eq.${kecamatanId}`);
  }
};
