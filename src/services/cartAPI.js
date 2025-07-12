import { api } from './baseApi.js';

export const cartAPI = {
  getCart: async (userId) => {
    const cartResponse = await api.get(`/carts?user_id=eq.${userId}&select=id`);
    const cartData = cartResponse.data[0];

    if (cartData) {
      const cartItemsResponse = await api.get(
        `/cart_items?cart_id=eq.${cartData.id}&select=*,products(*)`
      );
      return cartItemsResponse.data || [];
    }
    
    return [];
  },

  addToCart: async (userId, productId, jumlah = 1) => {
    let cartResponse = await api.get(`/carts?user_id=eq.${userId}&select=id`);
    let cartData = cartResponse.data[0];

    if (!cartData) {
      const newCartResponse = await api.post('/carts', { user_id: userId });
      cartData = newCartResponse.data[0];
    }

    const existingItemResponse = await api.get(
      `/cart_items?cart_id=eq.${cartData.id}&product_id=eq.${productId}&select=*`
    );
    const existingItem = existingItemResponse.data[0];

    if (existingItem) {
      await api.patch(`/cart_items?id=eq.${existingItem.id}`, {
        jumlah: existingItem.jumlah + jumlah
      });
    } else {
      await api.post('/cart_items', {
        cart_id: cartData.id,
        product_id: productId,
        jumlah: jumlah
      });
    }
  },

  // ✅ FUNGSI BARU: Update quantity item tertentu
  updateQuantity: async (cartItemId, newQuantity) => {
    await api.patch(`/cart_items?id=eq.${cartItemId}`, {
      jumlah: newQuantity
    });
  },

  removeFromCart: async (cartItemId) => {
    await api.delete(`/cart_items?id=eq.${cartItemId}`);
  },

  clearCart: async (userId) => {
    const cartResponse = await api.get(`/carts?user_id=eq.${userId}&select=id`);
    const cartData = cartResponse.data[0];

    if (cartData) {
      await api.delete(`/cart_items?cart_id=eq.${cartData.id}`);
    }
  }
};