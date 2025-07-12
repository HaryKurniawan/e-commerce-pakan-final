import React from 'react';

const CheckoutModal = ({ cart, totalAmount, onConfirm, onCancel, loading }) => {
  return (
    <div className="checkout-modal">
      <div className="modal-content">
        <h3>Confirm Your Order</h3>
        <div className="order-items">
          <h4>Order Items:</h4>
          {cart.map(item => (
            <div key={item.id} className="order-item">
              <p><strong>{item.products.nama_produk}</strong></p>
              <p>Quantity: {item.jumlah} × Rp {Number(item.products.harga).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="order-total">
          <h4>Total Amount: Rp {totalAmount.toLocaleString()}</h4>
        </div>
        <div className="modal-buttons">
          <button 
            className="checkout-button"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Confirm Order'}
          </button>
          <button 
            className="button secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;