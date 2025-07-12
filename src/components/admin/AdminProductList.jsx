import React, { useState } from 'react';
import '../styles/AdminProductList.css';

const AdminProductList = ({ products, onEdit, onDelete }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState({});

  const handleImageSelect = (productId, imageIndex) => {
    setSelectedImageIndex(prev => ({
      ...prev,
      [productId]: imageIndex
    }));
  };

  const getProductImages = (product) => {
    const images = [];
    if (product.product_photos && product.product_photos.length > 0) {
      const photos = product.product_photos[0];
      if (photos.url_foto) images.push(photos.url_foto);
      if (photos.url_foto_1) images.push(photos.url_foto_1);
      if (photos.url_foto_2) images.push(photos.url_foto_2);
    }
    return images;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="admin-product-list">
      <div className="list-header">
        <h3 className="list-title">Manage Products</h3>
        <div className="product-count">
          {products.length} {products.length === 1 ? 'Product' : 'Products'}
        </div>
      </div>

      <div className="products-grid">
        {products.map(product => {
          const images = getProductImages(product);
          const currentImageIndex = selectedImageIndex[product.id] || 0;
          const hasImages = images.length > 0;

          return (
            <div key={product.id} className="product-card">
              <div className="product-image-section">
                {hasImages ? (
                  <>
                    <div className="main-image-container">
                      <img 
                        src={images[currentImageIndex]} 
                        alt={product.nama_produk}
                        className="main-product-image"
                        loading="lazy"
                      />
                      {images.length > 1 && (
                        <div className="image-counter">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      )}
                    </div>
                    
                    {images.length > 1 && (
                      <div className="image-thumbnails">
                        {images.map((image, index) => (
                          <button
                            key={index}
                            className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                            onClick={() => handleImageSelect(product.id, index)}
                          >
                            <img 
                              src={image} 
                              alt={`${product.nama_produk} ${index + 1}`}
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-image-placeholder">
                    <span>No Image</span>
                  </div>
                )}
              </div>

              <div className="product-info">
                <div className="product-header">
                  <h4 className="product-name" title={product.nama_produk}>
                    {product.nama_produk}
                  </h4>
                  <div className="product-price">
                    {formatPrice(product.harga)}
                  </div>
                </div>

                <div className="product-meta">
                  <div className="stock-info">
                    <span className="stock-label">Stock:</span>
                    <span className={`stock-value ${product.stok <= 5 ? 'low-stock' : ''}`}>
                      {product.stok}
                    </span>
                  </div>
                  
                  {product.stok <= 5 && product.stok > 0 && (
                    <div className="stock-warning">Low Stock!</div>
                  )}
                  
                  {product.stok === 0 && (
                    <div className="out-of-stock">Out of Stock</div>
                  )}
                </div>

                {product.detail_produk && (
                  <div className="product-description">
                    <p title={product.detail_produk}>
                      {truncateText(product.detail_produk)}
                    </p>
                  </div>
                )}

                <div className="product-actions">
                  <button 
                    className="btn btn-edit"
                    onClick={() => onEdit(product)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-delete"
                    onClick={() => onDelete(product.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h4>No Products Found</h4>
          <p>Start by adding your first product to the inventory.</p>
        </div>
      )}
    </div>
  );
};

export default AdminProductList;