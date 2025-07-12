import { api } from './baseApi.js';

// Order Status API functions
export const orderStatusApi = {
  // Fetch all orders with related data
  fetchOrders: async () => {
    try {
      const response = await api.get('/orders?select=id,order_number,status_id,user_id,shipping_address_id,users(nama,email,no_hp),user_addresses(alamat_lengkap,nama_desa,rt,rw,provinsi(nama),kota_kabupaten(nama),kecamatan(nama))');
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Fetch all order statuses
  fetchStatuses: async () => {
    try {
      const response = await api.get('/order_status?select=id,nama');
      return response.data;
    } catch (error) {
      console.error('Error fetching statuses:', error);
      throw error;
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, statusId) => {
    try {
      const response = await api.patch(`/orders?id=eq.${orderId}`, {
        status_id: statusId
      });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Get order by ID
  fetchOrderById: async (orderId) => {
    try {
      const response = await api.get(`/orders?id=eq.${orderId}&select=id,order_number,status_id,user_id,shipping_address_id,users(nama,email,no_hp),user_addresses(alamat_lengkap,nama_desa,rt,rw,provinsi(nama),kota_kabupaten(nama),kecamatan(nama))`);
      return response.data[0] || null;
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      throw error;
    }
  },

  // Get orders by status
  fetchOrdersByStatus: async (statusId) => {
    try {
      const response = await api.get(`/orders?status_id=eq.${statusId}&select=id,order_number,status_id,user_id,shipping_address_id,users(nama,email,no_hp),user_addresses(alamat_lengkap,nama_desa,rt,rw,provinsi(nama),kota_kabupaten(nama),kecamatan(nama))`);
      return response.data;
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      throw error;
    }
  },

  // Search orders by order number or customer name
  searchOrders: async (searchQuery) => {
    try {
      // Search by order number
      const orderNumberResponse = await api.get(`/orders?order_number=ilike.*${searchQuery}*&select=id,order_number,status_id,user_id,shipping_address_id,users(nama,email,no_hp),user_addresses(alamat_lengkap,nama_desa,rt,rw,provinsi(nama),kota_kabupaten(nama),kecamatan(nama))`);
      
      // Search by customer name (through users relation)
      const customerNameResponse = await api.get(`/orders?users.nama=ilike.*${searchQuery}*&select=id,order_number,status_id,user_id,shipping_address_id,users(nama,email,no_hp),user_addresses(alamat_lengkap,nama_desa,rt,rw,provinsi(nama),kota_kabupaten(nama),kecamatan(nama))`);
      
      // Combine and deduplicate results
      const combinedResults = [...orderNumberResponse.data, ...customerNameResponse.data];
      const uniqueResults = combinedResults.filter((order, index, self) => 
        index === self.findIndex(o => o.id === order.id)
      );
      
      return uniqueResults;
    } catch (error) {
      console.error('Error searching orders:', error);
      throw error;
    }
  }
};