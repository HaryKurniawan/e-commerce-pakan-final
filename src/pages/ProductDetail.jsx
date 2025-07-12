// pages/ProductDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal } from 'antd';
import { api } from '../services/baseApi';

import { reviewsAPI } from '../services/reviewsAPI';
import { useCart } from '../hooks/useCart';
import ProductImageViewer from '../components/ProductImageViewer';
import './ProductDetail.css';
import ToCartIcon from '../assets/to-cart.svg';


const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [jumlah, setJumlah] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); // 'cart' or 'buy'
  const [modalQuantity, setModalQuantity] = useState(1);

  // Fungsi untuk memotong nama pengguna
  const truncateUserName = (name, maxLength = 8) => {
    if (!name) return 'Anonymous';
    
    // Cari spasi pertama
    const spaceIndex = name.indexOf(' ');
    
    // Jika ada spasi dan spasi berada sebelum atau sama dengan maxLength
    if (spaceIndex !== -1 && spaceIndex <= maxLength) {
      return name.substring(0, spaceIndex);
    }
    
    // Jika nama lebih panjang dari maxLength, potong dan tambahkan "..."
    if (name.length > maxLength) {
      return name.substring(0, maxLength) + '...';
    }
    
    // Jika nama tidak lebih panjang dari maxLength, return nama asli
    return name;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products?id=eq.${id}&select=*,product_photos(*)`);
        setProduct(response.data?.[0]);
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchProductReviews();
    }
  }, [id]);

  const fetchProductReviews = async () => {
    try {
      setLoading(true);
      const reviewsData = await reviewsAPI.getProductReviewsFromOrders(parseInt(id));
      setReviews(reviewsData);
      
      if (reviewsData.length > 0) {
        const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
        const average = totalRating / reviewsData.length;
        setAverageRating({
          average: average,
          count: reviewsData.length
        });
      } else {
        setAverageRating({ average: 0, count: 0 });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
      setAverageRating({ average: 0, count: 0 });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, size = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={`star ${i <= rating ? 'star-gold' : 'star-gray'}`}
          style={{ fontSize: `${size}px` }}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  // Fungsi untuk mendapatkan array URL foto produk
  const getProductImageUrls = () => {
    if (!product?.product_photos?.[0]) return [];
    
    const photos = [];
    const photoData = product.product_photos[0];
    
    if (photoData.url_foto) {
      photos.push(photoData.url_foto);
    }
    if (photoData.url_foto_1) {
      photos.push(photoData.url_foto_1);
    }
    if (photoData.url_foto_2) {
      photos.push(photoData.url_foto_2);
    }
    
    return photos;
  };

  // Modal handlers
  const showModal = (type) => {
    setModalType(type);
    setModalQuantity(1);
    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setModalQuantity(1);
  };

  const handleModalConfirm = () => {
    if (modalType === 'cart') {
      addToCart({ ...product, jumlah: modalQuantity });
    } else if (modalType === 'buy') {
      const item = {
        product_id: product.id,
        jumlah: modalQuantity,
        products: product,
      };
      navigate('/checkout', { 
        state: { 
          cartItems: [item], 
          totalAmount: product.harga * modalQuantity 
        } 
      });
    }
    setModalVisible(false);
    setModalQuantity(1);
  };

  const handleQuantityChange = (value) => {
    if (value >= 1 && value <= product.stok) {
      setModalQuantity(value);
    }
  };

  const handleViewAllReviews = () => {
    navigate(`/produk/${id}/ulasan`);
  };

  if (!product) return (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  );

  const productImages = getProductImageUrls();

  return (
    <div className="product-detail-container">

      <div className="product-info-section">

        {productImages.length > 0 ? (
          <ProductImageViewer images={productImages} />
        ) : (
          <div className="no-photos-message">
            <span className="text-secondary">Tidak ada foto produk tersedia</span>
          </div>
        )}


        <div className="contain-top-detail">
          <h3 className="product-title-detail">{product.nama_produk}</h3>
          <p>Stok:{product.stok}</p>
        </div>

        <div className="contain-top-detail">
          <h2 className="product-price-detail">Rp {Number(product.harga).toLocaleString()}</h2>
          <div className="rating-display">
            <div className="stars">{renderStars(Math.round(averageRating.average))} {averageRating.average.toFixed(1)}
            </div>
          </div>
        </div>
        <div className="contain-detail-produk">
        <p> {product.detail_produk}</p>

        </div>

        <div className="action-buttonss">
          <button className="btn-to-buy" onClick={() => showModal('buy')} disabled={product.stok === 0}>Beli Sekarang</button>
          <button className="btn-to-cart" onClick={() => showModal('cart')} disabled={product.stok === 0}><img src={ToCartIcon} /></button>
        </div>

      </div>

      <Modal
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={[]}
        width={600}
      >
        <div className="modal-contentt">

            <div className="modal-content-top">

              <div className="modal-product-imagee">
                {productImages.length > 0 ? (
                <img src={productImages[0]} className="product-images" />
                  ) : (
                  <div className="no-image">
                    <span className="text-secondary">No Image</span>
                  </div>
                  )}
              </div>

              <div className="modal-action-to-checkout">
                <h3 className="modal-product-price">Rp {Number(product.harga).toLocaleString()}</h3>
                <p>Stok:{product.stok}</p>
              </div>
            </div>
<hr />
            <div className="modal-content-bottom">

              <p>
                Jumlah
              </p>

              <div className="modal-quantity-controls">
                <button className="btn-small" onClick={() => handleQuantityChange(modalQuantity - 1)} disabled={modalQuantity <= 1}>-</button>
                <input
                  type="number"
                  min={1}
                  max={product.stok}
                  value={modalQuantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                  className="quantity-input"
                />
                <button className="btn-small" onClick={() => handleQuantityChange(modalQuantity + 1)} disabled={modalQuantity >= product.stok} >+</button>
              </div>

            </div>
            
            <div className="modal-content-bottom-btn">
<button 
                key="confirm" 
                onClick={handleModalConfirm}
                disabled={modalQuantity < 1 || modalQuantity > product.stok}
              >
                {modalType === 'cart' ? 'Tambah ke Keranjang' : 'Lanjut ke Checkout'}
              </button>
            </div>
              
        </div>
      </Modal>

      <div className="reviews-section">
        
        {loading ? (
          <div className="loading-reviews">
            <div className="spinner"></div>
            <span>Memuat ulasan...</span>
          </div>
        ) : (
          <>
            <div className="reviews-header">
              <h4 className="reviews-list-title">Ulasan
                 {/* ({reviews.length}) */}
              </h4>
              {reviews.length > 0 && (
                <button className="view-all-reviews-btn" onClick={handleViewAllReviews}>
                  Lihat semua
                </button>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="no-reviews-message">
                <span className="text-secondary">Belum ada ulasan untuk produk ini.</span>
              </div>
            ) : (
              <div className="reviews-cards-container">
                {reviews.slice(0, 3).map((review) => {
                  const productInOrder = review.orders?.order_items?.find(item => 
                    item.product_id === parseInt(id)
                  );
                  
                  return (
                    <div key={review.id} className="review-card">


                      <div className="review-card-header">

                        <div className="top-card-review">
                          <strong className="review-user-name">{truncateUserName(review.users?.nama)}</strong>
                          <div className="review-rating">
                            {renderStars(review.rating, 14)}
                            <span className="review-rating-text">
                              ({review.rating}/5)
                            </span>
                          </div>
                        </div>
                        
                        
                      </div>
                      <p className="review-content">
                        {review.ulasan.length > 100 ? 
                          `${review.ulasan.substring(0, 100)}...` : 
                          review.ulasan
                        }
                      </p>

                      {productInOrder && (
                        <span className="text-secondary review-purchase-info">
                          Membeli {productInOrder.quantity} item
                        </span>
                      )}

                      {/* <span className="text-secondary review-date">
                          {new Date(review.tanggal).toLocaleDateString('id-ID')}
                        </span> */}
                        
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;