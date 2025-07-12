import React, { useState } from 'react';
import { Typography } from 'antd';
import './styles/ProductImageViewer.css';

const { Text } = Typography;

const ProductImageViewer = ({ images }) => {
  const [mainImage, setMainImage] = useState(images[0]);

  const handleThumbnailClick = (url) => {
    setMainImage(url);
  };

  if (!images || images.length === 0) {
    return (
      <div className="no-images-container">
        <Text type="secondary">Tidak ada foto produk tersedia</Text>
      </div>
    );
  }

  return (
    <div className="product-image-viewer">
      <div className="main-image">
        <img 
          src={mainImage} 
          alt="Main Product" 
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>
      <div className="thumbnails">
        {images.slice(0, 3).map((url, index) => (
          <div 
            className={`thumbnail ${mainImage === url ? 'active' : ''}`} 
            key={index}
            onClick={() => handleThumbnailClick(url)}
          >
            <img
              src={url}
              alt={`Thumbnail ${index + 1}`}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        ))}
        
        {/* Fill empty spaces if less than 3 images */}
        {Array.from({ length: Math.max(0, 3 - images.length) }).map((_, index) => (
          <div key={`empty-${index}`} className="thumbnail empty">
            <div className="empty-thumbnail">
              <Text type="secondary">No Image</Text>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductImageViewer;