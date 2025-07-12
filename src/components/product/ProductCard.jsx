import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductCard.css'; // Import file CSS terpisah

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/produk/${product.id}`);
  };

  const firstPhoto = product.product_photos?.[0]?.url_foto;

  return (
    <div className="product-card" onClick={handleClick}>

      <div className="product-image-contain">
      {firstPhoto && (
        <img
          src={firstPhoto}
          alt={`Foto ${product.nama_produk}`}
          className="product-image"
        />
      )}
      </div>


      <div className="produkcard-section2">
      <h3 className="product-namee">{product.nama_produk}</h3>
      <p className="product-pricee">
        Rp {Number(product.harga).toLocaleString()}
      </p>
      </div>
    </div>
  );
};

export default ProductCard;
