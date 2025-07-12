import React from 'react';
import ProductList from '../components/product/ProductList';
import { useProducts } from '../hooks/useProducts';
import './home.css'

const Home = () => {
  const { products, loading } = useProducts();

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div className='home-contain' >
      <div className="poster">

      </div>
      <ProductList products={products} />
    </div>
  );
};

export default Home;