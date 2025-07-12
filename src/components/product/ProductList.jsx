import React from 'react';
import ProductCard from './ProductCard';
import  './ProductList.css'

const ProductList = ({ products }) => {
  if (!products || products.length === 0) {
    return <p>No products available</p>;
  }

  return (
    <div className="contain-card">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductList;