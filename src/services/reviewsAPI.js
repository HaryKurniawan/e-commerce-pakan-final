import { api } from './baseApi.js';

export const reviewsAPI = {
  // Create new order review
  createOrderReview: async (reviewData) => {
    const response = await api.post('/order_reviews', {
      user_id: reviewData.user_id,
      order_id: reviewData.order_id,
      rating: reviewData.rating,
      ulasan: reviewData.ulasan,
      tanggal: new Date().toISOString()
    });
    return response.data[0];
  },

  // Update existing order review
  updateOrderReview: async (reviewId, reviewData) => {
    const response = await api.patch(`/order_reviews?id=eq.${reviewId}`, {
      rating: reviewData.rating,
      ulasan: reviewData.ulasan,
      tanggal: new Date().toISOString()
    });
    return response.data[0];
  },

  // Get user's review for a specific order
  getUserOrderReview: async (userId, orderId) => {
    const response = await api.get(
      `/order_reviews?user_id=eq.${userId}&order_id=eq.${orderId}&select=*`
    );
    return response.data[0] || null;
  },

  // Get all reviews for an order (usually just one)
  getOrderReviews: async (orderId) => {
    const response = await api.get(
      `/order_reviews?order_id=eq.${orderId}&select=*,users(nama,username)&order=tanggal.desc`
    );
    return response.data;
  },

  // Get user's all order reviews
  getUserOrderReviews: async (userId) => {
    const response = await api.get(
      `/order_reviews?user_id=eq.${userId}&select=*,orders(order_number,order_items(products(nama_produk),quantity))&order=tanggal.desc`
    );
    return response.data;
  },

  // Delete order review
  deleteOrderReview: async (reviewId) => {
    await api.delete(`/order_reviews?id=eq.${reviewId}`);
  },

  // Get reviews for products (aggregate from order reviews)
  getProductReviewsFromOrders: async (productId) => {
    const response = await api.get(
      `/order_reviews?select=*,users(nama,username),orders(order_items(product_id,products(nama_produk),quantity))&order=tanggal.desc`
    );
    
    // Filter reviews that contain the specific product
    const filteredReviews = response.data.filter(review => 
      review.orders.order_items.some(item => item.product_id === productId)
    );
    
    return filteredReviews;
  }
};



