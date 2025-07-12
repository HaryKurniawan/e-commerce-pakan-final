import { api } from './baseApi.js';
import { productsAPI } from './productsAPI.js'; // Import productsAPI for stock operations

function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `ORD-${year}${month}${day}-${hours}${minutes}${seconds}`;
}

export const ordersAPI = {
  // Fixed createOrder method with better error handling and data validation
  createOrder: async (orderData) => {
    try {
      console.log('Creating order with data:', orderData);
      
      // Validate required fields
      if (!orderData.user_id) {
        throw new Error('User ID is required');
      }
      if (!orderData.total_amount || orderData.total_amount <= 0) {
        throw new Error('Total amount must be greater than 0');
      }
      if (!orderData.shipping_address_id) {
        throw new Error('Shipping address is required');
      }
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Order items are required');
      }

      // First, get available order statuses to find the correct ID
      let statusId = 1; // Default
      try {
        // FIXED: Use correct field name 'nama' instead of 'nama_status'
        const statusResponse = await api.get('/order_status?select=id,nama&order=id.asc');
        const statuses = statusResponse.data;
        console.log('Available order statuses:', statuses);
        
        // FIXED: Use correct field name 'nama' instead of 'nama_status'
        const pendingStatus = statuses.find(s => 
          s.nama.toLowerCase().includes('pending') || 
          s.nama.toLowerCase().includes('menunggu')
        );
        
        if (pendingStatus) {
          statusId = pendingStatus.id;
        } else if (statuses.length > 0) {
          statusId = statuses[0].id; // Use first available status
        }
        
        console.log('Using status_id:', statusId);
      } catch (statusError) {
        console.warn('Could not fetch order statuses, using default:', statusError);
      }

      // Create main order payload with proper field mapping
      const orderPayload = {
        user_id: parseInt(orderData.user_id),
        order_number: orderData.order_number || generateOrderNumber(),
        original_amount: parseFloat(orderData.original_amount || orderData.total_amount),
        discount_amount: parseFloat(orderData.discount_amount || 0),
        total_amount: parseFloat(orderData.total_amount),
        voucher_id: orderData.voucher_id || null,
        voucher_code: orderData.voucher_code || null,
        shipping_address_id: parseInt(orderData.shipping_address_id),
        notes: orderData.notes || null,
        status_id: statusId, // Use the validated status ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Order payload:', orderPayload);

      // Create the order
      const response = await api.post('/orders', orderPayload);
      console.log('Order created successfully:', response.data);
      
      const order = Array.isArray(response.data) ? response.data[0] : response.data;
      
      if (!order || !order.id) {
        throw new Error('Failed to create order - no order ID returned');
      }

      // Prepare order items
      const orderItems = orderData.items.map(item => ({
        order_id: parseInt(order.id),
        product_id: parseInt(item.product_id),
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
        subtotal: parseFloat(item.subtotal)
      }));

      console.log('Creating order items:', orderItems);

      // Create order items
      await api.post('/order_items', orderItems);
      
      // Add initial tracking record
      await api.post('/order_tracking', {
        order_id: parseInt(order.id),
        status_id: statusId, // Use the same validated status ID
        notes: 'Pesanan dibuat',
        created_by: parseInt(orderData.user_id),
        created_at: new Date().toISOString()
      });
      
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      
      // Provide more specific error messages
      if (error.response) {
        console.error('Response error:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        
        if (error.response.status === 400) {
          throw new Error(`Bad Request: ${error.response.data?.message || 'Invalid data sent to server'}`);
        } else if (error.response.status === 401) {
          throw new Error('Unauthorized: Please login again');
        } else if (error.response.status === 403) {
          throw new Error('Forbidden: You don\'t have permission to perform this action');
        } else if (error.response.status === 409) {
          const errorDetail = error.response.data?.details || '';
          if (errorDetail.includes('foreign key constraint')) {
            throw new Error('Data reference error: Please check if all referenced data exists (status, address, etc.)');
          } else if (errorDetail.includes('order_number')) {
            throw new Error('Order number already exists: Please try again');
          } else {
            throw new Error(`Conflict: ${error.response.data?.message || 'Data conflict occurred'}`);
          }
        } else {
          throw new Error(`Server error: ${error.response.data?.message || error.message}`);
        }
      } else if (error.request) {
        throw new Error('Network error: Unable to connect to server');
      } else {
        throw new Error(error.message || 'Unknown error occurred');
      }
    }
  },

  // Get user orders with enhanced error handling and logging
  getUserOrders: async (userId) => {
    try {
      console.log('Fetching orders for user:', userId);
      
      // Validate user ID
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const response = await api.get(`/orders?user_id=eq.${userId}&select=*,order_status(*),user_addresses(*,provinsi(*),kota_kabupaten(*),kecamatan(*)),order_items(*,products(*))&order=created_at.desc`);
      
      console.log('Orders API response:', response.data);
      console.log('Number of orders found:', response.data.length);
      
      // Debug: Log order status structure
      if (response.data.length > 0) {
        console.log('Sample order status structure:', response.data[0].order_status);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please login again');
      } else if (error.response?.status === 403) {
        throw new Error('Forbidden: You don\'t have permission to access these orders');
      } else if (error.response?.status === 404) {
        throw new Error('Orders not found');
      } else {
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }
    }
  },

  // Get all orders (admin) with enhanced error handling
  getAllOrders: async () => {
    try {
      console.log('Fetching all orders (admin)');
      
      const response = await api.get('/orders?select=*,users(username,nama_lengkap),order_status(*),user_addresses(*),order_items(*,products(*))&order=created_at.desc');
      
      console.log('All orders API response:', response.data);
      console.log('Number of orders found:', response.data.length);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching all orders:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please login as admin');
      } else if (error.response?.status === 403) {
        throw new Error('Forbidden: Admin access required');
      } else {
        throw new Error(`Failed to fetch all orders: ${error.message}`);
      }
    }
  },

  // Get order by ID with enhanced error handling
  getOrderById: async (orderId) => {
    try {
      console.log('Fetching order by ID:', orderId);
      
      if (!orderId) {
        throw new Error('Order ID is required');
      }
      
      const response = await api.get(`/orders?id=eq.${orderId}&select=*,users(*),order_status(*),user_addresses(*,provinsi(*),kota_kabupaten(*),kecamatan(*)),order_items(*,products(*))`);
      
      if (!response.data || response.data.length === 0) {
        throw new Error('Order not found');
      }
      
      console.log('Order found:', response.data[0]);
      
      return response.data[0];
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 404) {
        throw new Error('Order not found');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please login again');
      } else if (error.response?.status === 403) {
        throw new Error('Forbidden: You don\'t have permission to access this order');
      } else {
        throw new Error(`Failed to fetch order: ${error.message}`);
      }
    }
  },

  // Update order status with enhanced validation
  updateOrderStatus: async (orderId, statusId, notes, updatedBy) => {
    try {
      console.log('Updating order status:', { orderId, statusId, notes, updatedBy });
      
      // Validate required parameters
      if (!orderId || !statusId || !updatedBy) {
        throw new Error('Order ID, status ID, and updated by are required');
      }
      
      // Validate status exists
      const statuses = await ordersAPI.getOrderStatuses();
      const validStatus = statuses.find(s => s.id === parseInt(statusId));
      if (!validStatus) {
        throw new Error('Invalid status ID');
      }
      
      // Update order status
      await api.patch(`/orders?id=eq.${orderId}`, {
        status_id: parseInt(statusId),
        updated_at: new Date().toISOString()
      });
      
      // Add tracking record
      await api.post('/order_tracking', {
        order_id: parseInt(orderId),
        status_id: parseInt(statusId),
        notes: notes || `Status diubah ke ${validStatus.nama}`,
        created_by: parseInt(updatedBy),
        created_at: new Date().toISOString()
      });
      
      console.log('Order status updated successfully');
      
      return { success: true, message: 'Status pesanan berhasil diperbarui' };
    } catch (error) {
      console.error('Error updating order status:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 404) {
        throw new Error('Order not found');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please login again');
      } else if (error.response?.status === 403) {
        throw new Error('Forbidden: You don\'t have permission to update this order');
      } else {
        throw new Error(`Failed to update order status: ${error.message}`);
      }
    }
  },

  // Add order tracking (separate method) with enhanced validation
  addOrderTracking: async (orderId, statusId, notes, createdBy) => {
    try {
      console.log('Adding order tracking:', { orderId, statusId, notes, createdBy });
      
      // Validate required parameters
      if (!orderId || !statusId || !createdBy) {
        throw new Error('Order ID, status ID, and created by are required');
      }
      
      await api.post('/order_tracking', {
        order_id: parseInt(orderId),
        status_id: parseInt(statusId),
        notes: notes || '',
        created_by: parseInt(createdBy),
        created_at: new Date().toISOString()
      });
      
      console.log('Order tracking added successfully');
      
      return { success: true, message: 'Tracking pesanan berhasil ditambahkan' };
    } catch (error) {
      console.error('Error adding order tracking:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 404) {
        throw new Error('Order not found');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please login again');
      } else {
        throw new Error(`Failed to add order tracking: ${error.message}`);
      }
    }
  },

  // Get order tracking history with enhanced error handling
  getOrderTracking: async (orderId) => {
    try {
      console.log('Fetching order tracking for order:', orderId);
      
      if (!orderId) {
        throw new Error('Order ID is required');
      }
      
      const response = await api.get(`/order_tracking?order_id=eq.${orderId}&select=*,order_status(*),users(username,nama_lengkap)&order=created_at.desc`);
      
      console.log('Order tracking found:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching order tracking:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 404) {
        throw new Error('Order tracking not found');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please login again');
      } else {
        throw new Error(`Failed to fetch order tracking: ${error.message}`);
      }
    }
  },

  // Get order statuses with enhanced error handling
  getOrderStatuses: async () => {
    try {
      console.log('Fetching order statuses');
      
      const response = await api.get('/order_status?select=*&order=id.asc');
      
      console.log('Order statuses found:', response.data);
      
      if (!response.data || response.data.length === 0) {
        throw new Error('No order statuses found');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching order statuses:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please login again');
      } else {
        throw new Error(`Failed to fetch order statuses: ${error.message}`);
      }
    }
  },

  // Cancel order with stock restoration and enhanced validation
  cancelOrder: async (orderId, userId, reason) => {
    try {
      console.log('Cancelling order:', { orderId, userId, reason });
      
      // Validate required parameters
      if (!orderId || !userId) {
        throw new Error('Order ID and User ID are required');
      }
      
      if (!reason || reason.trim() === '') {
        throw new Error('Cancellation reason is required');
      }
      
      // Get order details with items
      const order = await ordersAPI.getOrderById(orderId);
      
      if (!order) {
        throw new Error('Pesanan tidak ditemukan');
      }
      
      // Verify user owns the order (unless admin)
      if (order.user_id !== parseInt(userId)) {
        throw new Error('Anda tidak memiliki izin untuk membatalkan pesanan ini');
      }

      // Check if order can be cancelled (not already cancelled or completed)
      const cancellableStatuses = [1, 2, 3]; // pending, confirmed, processing
      if (!cancellableStatuses.includes(order.status_id)) {
        const statusName = order.order_status?.nama || 'Unknown';
        throw new Error(`Pesanan tidak dapat dibatalkan pada status "${statusName}"`);
      }

      // Get current products data
      const products = await productsAPI.getAll();
      
      // Restore stock for each order item
      const stockRestorations = [];
      for (const orderItem of order.order_items) {
        const currentProduct = products.find(p => p.id === orderItem.product_id);
        
        if (currentProduct) {
          // Add back the quantity to current stock
          const newStock = currentProduct.stok + orderItem.quantity;
          await productsAPI.updateStock(orderItem.product_id, newStock);
          
          stockRestorations.push({
            productName: currentProduct.nama_produk,
            quantity: orderItem.quantity,
            oldStock: currentProduct.stok,
            newStock: newStock
          });
          
          console.log(`Stock restored for product ${currentProduct.nama_produk}: +${orderItem.quantity} (${currentProduct.stok} → ${newStock})`);
        }
      }

      // Get cancelled status ID
      const statuses = await ordersAPI.getOrderStatuses();
      const cancelledStatus = statuses.find(s => 
        s.nama.toLowerCase().includes('cancel') || 
        s.nama.toLowerCase().includes('batal')
      );
      const cancelStatusId = cancelledStatus ? cancelledStatus.id : 6; // fallback to 6

      // Update order status to cancelled
      await ordersAPI.updateOrderStatus(
        orderId, 
        cancelStatusId, 
        `Dibatalkan: ${reason}. Stok telah dikembalikan.`, 
        userId
      );

      console.log('Order cancelled successfully with stock restoration:', stockRestorations);

      return {
        success: true,
        message: 'Pesanan berhasil dibatalkan dan stok telah dikembalikan',
        stockRestorations: stockRestorations
      };

    } catch (error) {
      console.error('Error cancelling order:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 404) {
        throw new Error('Pesanan tidak ditemukan');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please login again');
      } else if (error.response?.status === 403) {
        throw new Error('Forbidden: You don\'t have permission to cancel this order');
      } else {
        throw new Error(`Gagal membatalkan pesanan: ${error.message}`);
      }
    }
  },

  // Helper function to restore stock (can be used for other scenarios)
  restoreOrderStock: async (orderId) => {
    try {
      console.log('Restoring stock for order:', orderId);
      
      if (!orderId) {
        throw new Error('Order ID is required');
      }
      
      const order = await ordersAPI.getOrderById(orderId);
      
      if (!order) {
        throw new Error('Pesanan tidak ditemukan');
      }

      const products = await productsAPI.getAll();
      const stockRestorations = [];
      
      for (const orderItem of order.order_items) {
        const currentProduct = products.find(p => p.id === orderItem.product_id);
        
        if (currentProduct) {
          const newStock = currentProduct.stok + orderItem.quantity;
          await productsAPI.updateStock(orderItem.product_id, newStock);
          
          stockRestorations.push({
            productName: currentProduct.nama_produk,
            quantity: orderItem.quantity,
            oldStock: currentProduct.stok,
            newStock: newStock
          });
        }
      }

      console.log('Stock restored successfully:', stockRestorations);
      
      return {
        success: true,
        message: 'Stok berhasil dikembalikan',
        stockRestorations: stockRestorations
      };
    } catch (error) {
      console.error('Error restoring order stock:', error);
      console.error('Error details:', error.response?.data);
      
      throw new Error(`Gagal mengembalikan stok: ${error.message}`);
    }
  }
};