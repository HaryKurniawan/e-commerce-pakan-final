// pages/ReviewsPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reviewsAPI } from '../services/reviewsAPI';
import { api } from '../services/baseApi';
import Header from '../components/common/Header'

import './ReviewsPage.css';

const ReviewsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [sortedReviews, setSortedReviews] = useState([]);
  const [averageRating, setAverageRating] = useState({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, highest, lowest

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products?id=eq.${id}&select=*`);
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

  useEffect(() => {
    // Sort reviews whenever reviews or sortBy changes
    const sorted = [...reviews].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.tanggal) - new Date(a.tanggal);
        case 'oldest':
          return new Date(a.tanggal) - new Date(b.tanggal);
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return new Date(b.tanggal) - new Date(a.tanggal);
      }
    });
    setSortedReviews(sorted);
  }, [reviews, sortBy]);

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

  const handleGoBack = () => {
    navigate(`/produk/${id}`);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'newest':
        return 'Terbaru';
      case 'oldest':
        return 'Terlama';
      case 'highest':
        return 'Rating Tertinggi';
      case 'lowest':
        return 'Rating Terendah';
      default:
        return 'Terbaru';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <span>Memuat ulasan...</span>
      </div>
    );
  }

  return (
    <div className="reviews-page-container">
       <Header title="Review" />

      {product && (
        <div className="product-summary">
          <h2>{product.nama_produk}</h2>
          <div className="rating-summary">
            <div className="stars">{renderStars(Math.round(averageRating.average), 20)}</div>
            <span>{averageRating.average.toFixed(1)} dari {averageRating.count} ulasan</span>
          </div>
        </div>
      )}

      {reviews.length > 0 && (
        <div className="sort-controls">
          <label htmlFor="sort-select">Urutkan berdasarkan:</label>
          <select 
            id="sort-select"
            className="sort-select"
            value={sortBy}
            onChange={handleSortChange}
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="highest">Rating Tertinggi</option>
            <option value="lowest">Rating Terendah</option>
          </select>
        </div>
      )}

      <div className="reviews-content">
        {sortedReviews.length === 0 ? (
          <div className="no-reviews-message">
            <span className="text-secondary">Belum ada ulasan untuk produk ini.</span>
          </div>
        ) : (
          <div className="reviews-list">
            {sortedReviews.map((review) => {
              const productInOrder = review.orders?.order_items?.find(item => 
                item.product_id === parseInt(id)
              );
              
              return (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <div className="review-user-info">
                      <strong>{review.users?.nama || 'Anonymous'}</strong>
                      <div className="review-rating">
                        {renderStars(review.rating, 18)}
                        <span className="review-rating-text">
                          ({review.rating}/5)
                        </span>
                      </div>
                      {productInOrder && (
                        <span className="review-purchase-info">
                          Membeli {productInOrder.quantity} item
                        </span>
                      )}
                    </div>
                    <span className="review-date">
                      {new Date(review.tanggal).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="review-content">
                    {review.ulasan}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;