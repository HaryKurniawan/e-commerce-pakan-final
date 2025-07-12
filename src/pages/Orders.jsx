import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/ordersAPI';
import { reviewsAPI } from '../services/reviewsAPI';
import { useAuth } from '../context/AuthContext';
import './orders.css'

const Orders = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
  
  // Review states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    ulasan: ''
  });
  const [orderReviews, setOrderReviews] = useState({});

  useEffect(() => {
    if (currentUser?.id) {
      loadOrders();
    }
  }, [currentUser]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading orders for user:', currentUser.id);
      const userOrders = await ordersAPI.getUserOrders(currentUser.id);
      console.log('Orders loaded:', userOrders);
      
      setOrders(userOrders);
      
      // Load existing reviews for delivered orders
      await loadExistingOrderReviews(userOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      setError(error.message || 'Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingOrderReviews = async (orders) => {
    try {
      // Find delivered orders - check both nama and deskripsi fields
      const deliveredOrders = orders.filter(order => {
        const statusName = order.order_status?.nama?.toLowerCase() || '';
        const statusDesc = order.order_status?.deskripsi?.toLowerCase() || '';
        return statusName.includes('delivered') || statusName.includes('selesai') || 
               statusDesc.includes('delivered') || statusDesc.includes('selesai');
      });
      
      const reviews = {};
      
      for (const order of deliveredOrders) {
        try {
          const existingReview = await reviewsAPI.getUserOrderReview(currentUser.id, order.id);
          if (existingReview) {
            reviews[order.id] = existingReview;
          }
        } catch (reviewError) {
          console.warn('Error loading review for order', order.id, reviewError);
        }
      }
      
      setOrderReviews(reviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  // Helper function to determine if order is active
  const isActiveOrder = (order) => {
    if (!order.order_status) return false;
    
    const statusName = order.order_status.nama?.toLowerCase() || '';
    const statusDesc = order.order_status.deskripsi?.toLowerCase() || '';
    
    // Define active statuses - adjust these based on your actual status names
    const activeStatuses = [
      'pending', 'menunggu', 'confirmed', 'dikonfirmasi', 'confirmed',
      'processing', 'diproses', 'shipped', 'dikirim', 'dalam pengiriman'
    ];
    
    return activeStatuses.some(status => 
      statusName.includes(status) || statusDesc.includes(status)
    );
  };

  // Helper function to determine if order is completed
  const isCompletedOrder = (order) => {
    if (!order.order_status) return false;
    
    const statusName = order.order_status.nama?.toLowerCase() || '';
    const statusDesc = order.order_status.deskripsi?.toLowerCase() || '';
    
    // Define completed statuses - adjust these based on your actual status names
    const completedStatuses = [
      'delivered', 'selesai', 'terkirim', 'cancelled', 'dibatalkan', 'batal'
    ];
    
    return completedStatuses.some(status => 
      statusName.includes(status) || statusDesc.includes(status)
    );
  };

  // Filter orders based on active tab
  const getFilteredOrders = () => {
    if (activeTab === 'active') {
      return orders.filter(order => isActiveOrder(order));
    } else {
      return orders.filter(order => isCompletedOrder(order));
    }
  };

  const getOrderCount = (type) => {
    if (type === 'active') {
      return orders.filter(order => isActiveOrder(order)).length;
    } else {
      return orders.filter(order => isCompletedOrder(order)).length;
    }
  };

  const handleViewDetails = (order) => {
    // Navigate to order detail page with order data in state
    navigate('/order-detail', { state: { order } });
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert('Harap berikan alasan pembatalan');
      return;
    }

    try {
      await ordersAPI.cancelOrder(selectedOrder.id, currentUser.id, cancelReason);
      await loadOrders();
      setShowCancelModal(false);
      setSelectedOrder(null);
      setCancelReason('');
      alert('Pesanan berhasil dibatalkan');
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(error.message || 'Gagal membatalkan pesanan');
    }
  };

  const handleReviewOrder = (order) => {
    setSelectedOrderForReview(order);
    
    // Check if review already exists for this order
    const existingReview = orderReviews[order.id];
    if (existingReview) {
      setReviewData({
        rating: existingReview.rating,
        ulasan: existingReview.ulasan
      });
    } else {
      setReviewData({
        rating: 5,
        ulasan: ''
      });
    }
    
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewData.ulasan.trim()) {
      alert('Harap berikan ulasan Anda');
      return;
    }

    try {
      const existingReview = orderReviews[selectedOrderForReview.id];
      
      if (existingReview) {
        // Update existing order review
        await reviewsAPI.updateOrderReview(existingReview.id, {
          rating: reviewData.rating,
          ulasan: reviewData.ulasan.trim()
        });
        alert('Ulasan pesanan berhasil diperbarui!');
      } else {
        // Create new order review
        await reviewsAPI.createOrderReview({
          user_id: currentUser.id,
          order_id: selectedOrderForReview.id,
          rating: reviewData.rating,
          ulasan: reviewData.ulasan.trim()
        });
        alert('Terima kasih atas ulasan pesanan Anda!');
      }
      
      // Refresh reviews
      await loadOrders();
      setShowReviewModal(false);
      setSelectedOrderForReview(null);
      setReviewData({ rating: 5, ulasan: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.message || 'Gagal menyimpan ulasan');
    }
  };

  const getStatusColor = (order) => {
    if (!order.order_status) return '#6b7280';
    
    const statusName = order.order_status.nama?.toLowerCase() || '';
    const statusDesc = order.order_status.deskripsi?.toLowerCase() || '';
    
    // Color mapping based on status patterns
    if (statusName.includes('pending') || statusName.includes('menunggu')) {
      return '#ECEDEC';
    } else if (statusName.includes('confirmed') || statusName.includes('dikonfirmasi')) {
      return '#FFAC4D';
    } else if (statusName.includes('processing') || statusName.includes('diproses')) {
      return '#FFAC4D';
    } else if (statusName.includes('shipped') || statusName.includes('dikirim')) {
      return '#C3EB6D';
    } else if (statusName.includes('delivered') || statusName.includes('selesai')) {
      return '#C3EB6D';
    } else if (statusName.includes('cancelled') || statusName.includes('batal')) {
      return '#ef4444';
    }
    
    return '#6b7280';
  };

  const canCancelOrder = (order) => {
    if (!order.order_status) return false;
    
    const statusName = order.order_status.nama?.toLowerCase() || '';
    const statusDesc = order.order_status.deskripsi?.toLowerCase() || '';
    
    // Can cancel if status is pending or confirmed
    return statusName.includes('pending') || statusName.includes('menunggu') ||
           statusName.includes('confirmed') || statusName.includes('dikonfirmasi') ||
           statusDesc.includes('pending') || statusDesc.includes('menunggu') ||
           statusDesc.includes('confirmed') || statusDesc.includes('dikonfirmasi');
  };

  const canReviewOrder = (order) => {
    if (!order.order_status) return false;
    
    const statusName = order.order_status.nama?.toLowerCase() || '';
    const statusDesc = order.order_status.deskripsi?.toLowerCase() || '';
    
    // Can review if status is delivered/completed
    return statusName.includes('delivered') || statusName.includes('selesai') ||
           statusDesc.includes('delivered') || statusDesc.includes('selesai');
  };

  const renderStars = (rating, onRatingChange = null) => {
    return (
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''} ${onRatingChange ? 'clickable' : ''}`}
            onClick={onRatingChange ? () => onRatingChange(star) : undefined}
          >
            ⭐
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Memuat pesanan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <button onClick={loadOrders} className="retry-button">
          Coba Lagi
        </button>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <div className="orders-container">
      {/* Debug info - remove in production */}
      <div style={{ display: 'none' }}>
        <p>Total orders: {orders.length}</p>
        <p>Active orders: {getOrderCount('active')}</p>
        <p>Completed orders: {getOrderCount('completed')}</p>
        {orders.length > 0 && (
          <div>
            <p>Sample order status:</p>
            <pre>{JSON.stringify(orders[0].order_status, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="orders-tabs">
        <button
          className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Aktif ({getOrderCount('active')})
        </button>
        <button
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Selesai 
          {/* ({getOrderCount('completed')}) */}
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            {activeTab === 'active' ? (
              <>
                <p>Tidak ada pesanan aktif</p>
                <p className="no-orders-subtitle">Pesanan yang sedang diproses akan muncul di sini</p>
                <button 
                  onClick={() => navigate('/')}
                  className="shop-now-button"
                >
                  Mulai Belanja
                </button>
              </>
            ) : (
              <>
                <p>Tidak ada pesanan selesai</p>
                <p className="no-orders-subtitle">Pesanan yang sudah selesai atau dibatalkan akan muncul di sini</p>
              </>
            )}
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    {/* <span className="order-number">#{order.order_number}</span>
                    <span className="order-date">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span> */}
                  </div>
                  <div 
                    className="order-status"
                    style={{ backgroundColor: getStatusColor(order) }}
                  >
                    {order.order_status?.deskripsi || order.order_status?.nama || 'Status Tidak Diketahui'}
                  </div>
                </div>

                <div className="order-items">
                  {order.order_items && order.order_items.length > 0 ? (
                    order.order_items.map(item => (
                      <div key={item.id} className="order-item">
                        <div className="item-info">
                          <span className="item-name">
                            {item.products?.nama_produk || 'Produk Tidak Diketahui'}
                          </span>
                          <span className="item-quantity">x{item.quantity}</span>
                          <span className="item-price">
                            Rp {Number(item.subtotal || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="order-item">
                      <div className="item-info">
                        <span className="item-name">Item tidak tersedia</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="order-footer">
                  <div className="order-total">
                    <p>Total:</p> 
                    <p>Rp {Number(order.total_amount || 0).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="order-actions">
                    <button 
                      onClick={() => handleViewDetails(order)}
                      className="view-details-button"
                    >
                      Lihat Detail
                    </button>
                    {canCancelOrder(order) && (
                      <button 
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowCancelModal(true);
                        }}
                        className="cancel-order-button"
                      >
                        Batalkan
                      </button>
                    )}
                    {canReviewOrder(order) && (
                      <div className="order-review-section">
                        {orderReviews[order.id] ? (
                          <div className="existing-review">
                            <button 
                              onClick={() => handleReviewOrder(order)}
                              className="edit-review-button"
                            >
                              Edit Ulasan
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleReviewOrder(order)}
                            className="review-button"
                          >
                            Beri Ulasan
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>


            <div className="modal-body">
              <p>Apakah Anda yakin ingin membatalkan pesanan {/* {selectedOrder?.order_number} */}?</p>
              
              <div className="cancel-reason-section">
                <label htmlFor="cancelReason">Alasan Pembatalan:</label>
                <textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Berikan alasan pembatalan..."
                  rows="3"
                  className="cancel-reason-textarea"
                />
              </div>

              <div className="cancel-actions">
                <button 
                  onClick={() => setShowCancelModal(false)}
                  className="cancel-orders-cancel-button"
                >
                  Batal
                </button>
                <button 
                  onClick={handleCancelOrder}
                  className="confirm-orders-cancel-button"
                >
                  Ya, Batalkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedOrderForReview && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content review-modal" onClick={e => e.stopPropagation()}>
            

            <div className="modal-body">
              <div className="order-review-info">
                {/* <h4>Pesanan #{selectedOrderForReview.order_number}</h4> */}
                {/* <div className="review-order-items">
                  <p><strong>Produk yang Anda beli:</strong></p>
                  <div className="products-list-review">
                    {selectedOrderForReview.order_items && selectedOrderForReview.order_items.map(item => (
                      <div key={item.id} className="product-item">
                        <p className="product-name">
                          {item.products?.nama_produk || 'Produk Tidak Diketahui'} x{item.quantity}
                        </p>
                      </div>
                    ))}
                  </div>
                </div> */}
              </div>

              <div className="rating-section">
                <label>Rating Pesanan:</label>
                {renderStars(reviewData.rating, (rating) => setReviewData({...reviewData, rating}))}
                <span className="rating-text">({reviewData.rating} dari 5 bintang)</span>
              </div>

              <div className="review-text-section">
                <label htmlFor="reviewText">Ulasan Anda untuk pesanan ini:</label>
                <textarea
                  id="reviewText"
                  value={reviewData.ulasan}
                  onChange={(e) => setReviewData({...reviewData, ulasan: e.target.value})}
                  placeholder="Bagikan pengalaman Anda dengan pesanan ini secara keseluruhan (kualitas produk, layanan, pengiriman, dll)..."
                  rows="4"
                  className="review-textarea"
                />
                {/* <small>Ulasan ini akan mencakup semua produk dalam pesanan #{selectedOrderForReview.order_number}</small> */}
              </div>

              <div className="review-actions">
                <button 
                  onClick={() => setShowReviewModal(false)}
                  className="cancel-orders-cancel-button"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSubmitReview}
                  className="confirm-orders-cancel-button"
                >
                  {orderReviews[selectedOrderForReview.id] ? 'Perbarui Ulasan' : 'Kirim Ulasan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;