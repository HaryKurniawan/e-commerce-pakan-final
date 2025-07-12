// context/CartContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../services/cartAPI';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const fetchCart = async () => {
    if (!currentUser) {
      setCart([]);
      return;
    }

    try {
      setLoading(true);
      const cartData = await cartAPI.getCart(currentUser.id);
      setCart(cartData);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product) => {
    if (!currentUser) {
      alert('Please login first');
      return;
    }

    try {
      // Optimistic update - update UI immediately
      const existingItemIndex = cart.findIndex(item => item.product_id === product.id);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        setCart(prevCart => {
          const updatedCart = [...prevCart];
          updatedCart[existingItemIndex] = {
            ...updatedCart[existingItemIndex],
            jumlah: updatedCart[existingItemIndex].jumlah + product.jumlah
          };
          return updatedCart;
        });
      } else {
        // Add new item
        const newCartItem = {
          id: Date.now(), // temporary ID
          product_id: product.id,
          jumlah: product.jumlah,
          products: product
        };
        setCart(prevCart => [...prevCart, newCartItem]);
      }

      // Update backend
      await cartAPI.addToCart(currentUser.id, product.id, product.jumlah);
      
      // Refresh to ensure data consistency
      await fetchCart();
      
      alert(`Berhasil menambahkan ${product.jumlah} item ke keranjang`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Revert on error
      await fetchCart();
      alert('Error adding to cart: ' + (error.response?.data?.message || error.message));
    }
  };

  // ✅ FUNGSI BARU: Update quantity item di cart
  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      // Jika quantity 0 atau kurang, hapus item
      await removeFromCart(cartItemId);
      return;
    }

    try {
      // Optimistic update
      setCart(prevCart => 
        prevCart.map(item => 
          item.id === cartItemId 
            ? { ...item, jumlah: newQuantity }
            : item
        )
      );

      // Update backend
      await cartAPI.updateQuantity(cartItemId, newQuantity);
      
      // Refresh to ensure consistency
      await fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Revert on error
      await fetchCart();
      alert('Error updating quantity: ' + (error.response?.data?.message || error.message));
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      // Optimistic update
      setCart(prevCart => prevCart.filter(item => item.id !== cartItemId));
      
      await cartAPI.removeFromCart(cartItemId);
      
      // Refresh to ensure consistency
      await fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      // Revert on error
      await fetchCart();
      alert('Error removing from cart: ' + (error.response?.data?.message || error.message));
    }
  };

  const clearCart = async () => {
    if (!currentUser) return;

    try {
      // Optimistic update
      setCart([]);
      
      await cartAPI.clearCart(currentUser.id);
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Revert on error
      await fetchCart();
      throw error;
    }
  };

  useEffect(() => {
    fetchCart();
  }, [currentUser]);

  const totalAmount = cart.reduce((total, item) => 
    total + (Number(item.products?.harga || 0) * item.jumlah), 0
  );

  // Calculate cart count (number of unique products, not total quantity)
  const cartCount = cart.length; // Menggunakan cart.length untuk menghitung jumlah produk unik

  const value = {
    cart,
    loading,
    addToCart,
    removeFromCart,
    clearCart,
    fetchCart,
    updateQuantity, // ✅ TAMBAH FUNGSI BARU
    totalAmount,
    cartCount // Now returns number of unique products
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};