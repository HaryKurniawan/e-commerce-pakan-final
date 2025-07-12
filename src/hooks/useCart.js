// hooks/useCart.js
import { useState, useEffect } from 'react';
import { cartAPI } from '../services/cartAPI';
import { useAuth } from '../context/AuthContext';
import { useCartContext } from '../context/CartContext';

export const useCart = () => {
  // Try to get cart from context first (for real-time updates)
  try {
    const contextCart = useCartContext();
    // If context is available, use it for real-time updates
    return contextCart;
  } catch (error) {
    // If context is not available, fallback to local state
    // This maintains backward compatibility
  }

  // Fallback to original implementation
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
      // Kirim product.id dan jumlah
      await cartAPI.addToCart(currentUser.id, product.id, product.jumlah);
      await fetchCart();
      alert(`Berhasil menambahkan ${product.jumlah} item ke keranjang`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding to cart: ' + (error.response?.data?.message || error.message));
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await cartAPI.removeFromCart(cartItemId);
      await fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert('Error removing from cart: ' + (error.response?.data?.message || error.message));
    }
  };

  // Add updateQuantity function
  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      // If quantity is 0 or less, remove the item
      await removeFromCart(cartItemId);
      return;
    }

    try {
      // Assuming you have an updateCart API method
      await cartAPI.updateCartItem(cartItemId, newQuantity);
      await fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Error updating quantity: ' + (error.response?.data?.message || error.message));
    }
  };

  const clearCart = async () => {
    if (!currentUser) return;

    try {
      await cartAPI.clearCart(currentUser.id);
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchCart();
  }, [currentUser]);

  const totalAmount = cart.reduce((total, item) => 
    total + (Number(item.products?.harga || 0) * item.jumlah), 0
  );

  // For fallback implementation, also return number of unique products
  const cartCount = cart.length;

  return {
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity, // Add this to the return object
    clearCart,
    fetchCart,
    totalAmount,
    cartCount // Returns number of unique products
  };
};