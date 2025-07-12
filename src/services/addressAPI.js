import { api } from './baseApi.js';

// Address API
export const addressAPI = {
  // Get all provinces
  getProvinsi: async () => {
    const response = await api.get('/provinsi?select=*');
    return response.data;
  },

  // Get kota/kabupaten by provinsi
  getKotaKabupaten: async (provinsiId) => {
    const response = await api.get(`/kota_kabupaten?provinsi_id=eq.${provinsiId}&select=*`);
    return response.data;
  },

  // Get kecamatan by kota/kabupaten
  getKecamatan: async (kotaKabupatenId) => {
    const response = await api.get(`/kecamatan?kota_kabupaten_id=eq.${kotaKabupatenId}&select=*`);
    return response.data;
  },

  // Get user addresses
  getUserAddresses: async (userId) => {
    const response = await api.get(`/user_addresses?user_id=eq.${userId}&select=*,provinsi(*),kota_kabupaten(*),kecamatan(*)`);
    return response.data;
  },

  // Add new address
  addAddress: async (addressData) => {
    const response = await api.post('/user_addresses', addressData);
    return response.data[0];
  },

  // Update address
  updateAddress: async (addressId, addressData) => {
    const response = await api.patch(`/user_addresses?id=eq.${addressId}`, addressData);
    return response.data[0];
  },

  // Delete address
  deleteAddress: async (addressId) => {
    await api.delete(`/user_addresses?id=eq.${addressId}`);
  },

  // Set primary address
  setPrimaryAddress: async (userId, addressId) => {
    // Reset all addresses to non-primary
    await api.patch(`/user_addresses?user_id=eq.${userId}`, { is_primary: false });
    // Set selected address as primary
    await api.patch(`/user_addresses?id=eq.${addressId}`, { is_primary: true });
  }
};