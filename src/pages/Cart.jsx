import React, { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { useVouchers } from '../hooks/useVouchers';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CartItem from '../components/cart/CartItem';
import VoucherSection from '../components/cart/VoucherSection';
import Header from '../components/common/Header';
import NotificationToast from '../components/common/NotificationToast';
import './Cart.css';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, totalAmount } = useCart();
  const { validateVoucher, loading: voucherLoading } = useVouchers();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [voucherCode, setVoucherCode] = useState('');
  
  const [notification, setNotification] = useState({
    show: false,
    type: '', 
    message: ''
  });

  const finalAmount = totalAmount - discountAmount;

  const showNotification = (type, message) => {
    setNotification({
      show: true,
      type,
      message
    });
    
    setTimeout(() => {
      setNotification({
        show: false,
        type: '',
        message: ''
      });
    }, 3000);
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      showNotification('error', 'Masukkan kode voucher');
      return;
    }

    if (!currentUser) {
      showNotification('error', 'Silakan login terlebih dahulu');
      return;
    }

    try {
      const result = await validateVoucher(voucherCode, totalAmount, currentUser.id);
      
      setAppliedVoucher(result.voucher);
      setDiscountAmount(result.discountAmount);
      showNotification('success', `Voucher berhasil diterapkan! Diskon: Rp ${result.discountAmount.toLocaleString()}`);
      
    } catch (error) {
      showNotification('error', error.message);
      setAppliedVoucher(null);
      setDiscountAmount(0);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setDiscountAmount(0);
    setVoucherCode('');
    showNotification('success', 'Voucher berhasil dihapus');
  };

  const handleNavigateToCheckout = () => {
    if (cart.length === 0) {
      showNotification('error', 'Keranjang kosong!');
      return;
    }

    const checkoutData = {
      cartItems: cart,
      totalAmount,
      appliedVoucher,
      discountAmount,
      finalAmount
    };

    navigate('/checkout', { state: checkoutData });
  };

  return (
    <div className="cart-container">
      <Header title="keranjang" />

      <NotificationToast 
        show={notification.show}
        type={notification.type}
        message={notification.message}
      />

      {cart.length === 0 ? (
        <p>Keranjang Anda kosong.</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map(item => (
              <CartItem 
                key={item.id} 
                item={item} 
                onRemove={removeFromCart}
                onUpdateQuantity={updateQuantity}
              />
            ))}
          </div>

          <div className="cart-bottom">

         

            <div className="cart-summary">
              
              <div className="summary-details">
                   <VoucherSection
                      voucherCode={voucherCode}
                      setVoucherCode={setVoucherCode}
                      onApplyVoucher={handleApplyVoucher}
                      onRemoveVoucher={handleRemoveVoucher}
                      appliedVoucher={appliedVoucher}
                      loading={voucherLoading}
                    />

                    <div className="summmary-row-contain">

                    <div className="summary-row">
                      <span>Subtotal</span>
                      <span>Rp {totalAmount.toLocaleString()}</span>
                    </div>

                    <div className="summary-row">
                      <span>Ongkir</span>
                      <span>Rp 0</span>
                    </div>

                    <div className="summary-row discount-row">
                      <span>Vocher</span>
                      <span className={discountAmount > 0 ? "discount-amount" : ""}>
                        -Rp {discountAmount > 0 ? discountAmount.toLocaleString() : '0'}
                      </span>
                    </div>

                    </div>

                <div className="dashed-line"></div>

                <div className="bottom-cart-summary">
                  <div className="bottom-sumary-teks">
                    <span className="total-label">Total</span> <br />
                    <span className="total-harga">Rp {(finalAmount || totalAmount).toLocaleString()}</span>
                  </div>
                  <button 
                    className="checkout_button" 
                    onClick={handleNavigateToCheckout} 
                    disabled={cart.length === 0}
                  >
                    Checkout
                  </button>
                </div>
                
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;