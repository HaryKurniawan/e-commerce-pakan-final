import { api } from './baseApi.js';

// Order Status API functions
export const orderStatusApi = {
  // Fetch all orders with related data including payment proof
  fetchOrders: async () => {
    try {
      const response = await api.get('/orders?select=id,order_number,status_id,user_id,shipping_address_id,payment_proof_url,payment_proof_filename,users(nama,email,no_hp),user_addresses(alamat_lengkap,nama_desa,rt,rw,provinsi(nama),kota_kabupaten(nama),kecamatan(nama))');
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

  // Get order by ID including payment proof
  fetchOrderById: async (orderId) => {
    try {
      const response = await api.get(`/orders?id=eq.${orderId}&select=id,order_number,status_id,user_id,shipping_address_id,payment_proof_url,payment_proof_filename,users(nama,email,no_hp),user_addresses(alamat_lengkap,nama_desa,rt,rw,provinsi(nama),kota_kabupaten(nama),kecamatan(nama))`);
      return response.data[0] || null;
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      throw error;
    }
  },

  // Get orders by status including payment proof
  fetchOrdersByStatus: async (statusId) => {
    try {
      const response = await api.get(`/orders?status_id=eq.${statusId}&select=id,order_number,status_id,user_id,shipping_address_id,payment_proof_url,payment_proof_filename,users(nama,email,no_hp),user_addresses(alamat_lengkap,nama_desa,rt,rw,provinsi(nama),kota_kabupaten(nama),kecamatan(nama))`);
      return response.data;
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      throw error;
    }
  },

  // Search orders by order number or customer name including payment proof
  searchOrders: async (searchQuery) => {
    try {
      // Search by order number
      const orderNumberResponse = await api.get(`/orders?order_number=ilike.*${searchQuery}*&select=id,order_number,status_id,user_id,shipping_address_id,payment_proof_url,payment_proof_filename,users(nama,email,no_hp),user_addresses(alamat_lengkap,nama_desa,rt,rw,provinsi(nama),kota_kabupaten(nama),kecamatan(nama))`);
      
      // Search by customer name (through users relation)
      const customerNameResponse = await api.get(`/orders?users.nama=ilike.*${searchQuery}*&select=id,order_number,status_id,user_id,shipping_address_id,payment_proof_url,payment_proof_filename,users(nama,email,no_hp),user_addresses(alamat_lengkap,nama_desa,rt,rw,provinsi(nama),kota_kabupaten(nama),kecamatan(nama))`);
      
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
  },

  // Get payment proof details for specific order
  fetchPaymentProof: async (orderId) => {
    try {
      const response = await api.get(`/orders?id=eq.${orderId}&select=id,order_number,payment_proof_url,payment_proof_filename,users(nama)`);
      const order = response.data[0];
      
      if (!order || !order.payment_proof_url) {
        return null;
      }
      
      return {
        orderId: order.id,
        orderNumber: order.order_number,
        customerName: order.users?.nama || 'Tidak Diketahui',
        paymentProofUrl: order.payment_proof_url,
        paymentProofFilename: order.payment_proof_filename
      };
    } catch (error) {
      console.error('Error fetching payment proof:', error);
      throw error;
    }
  },

  // Get orders with payment proof (for admin dashboard)
  fetchOrdersWithPaymentProof: async () => {
    try {
      const response = await api.get('/orders?payment_proof_url=not.is.null&select=id,order_number,status_id,user_id,payment_proof_url,payment_proof_filename,created_at,users(nama,email),order_status(nama)&order=created_at.desc');
      return response.data;
    } catch (error) {
      console.error('Error fetching orders with payment proof:', error);
      throw error;
    }
  },

  // Get orders without payment proof (pending payment)
  fetchOrdersWithoutPaymentProof: async () => {
    try {
      const response = await api.get('/orders?payment_proof_url=is.null&select=id,order_number,status_id,user_id,created_at,users(nama,email),order_status(nama)&order=created_at.desc');
      return response.data;
    } catch (error) {
      console.error('Error fetching orders without payment proof:', error);
      throw error;
    }
  }
};