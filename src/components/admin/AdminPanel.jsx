import React, { useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import ProductForm from '../../components/admin/ProductForm';
import AdminProductList from '../../components/admin/AdminProductList';

const AdminPanel = () => {
  const { products, createProduct, updateProduct, deleteProduct, loading } = useProducts();
  const [editingProduct, setEditingProduct] = useState(null);

  const handleProductSubmit = async (productData) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
      setEditingProduct(null);
    } else {
      await createProduct(productData);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (productId) => {
    await deleteProduct(productId);
  };

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>
      
      <ProductForm 
        onSubmit={handleProductSubmit}
        editingProduct={editingProduct}
        onCancelEdit={handleCancelEdit}
        loading={loading}
      />

      <AdminProductList 
        products={products}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
      />
    </div>
  );
};

export default AdminPanel;