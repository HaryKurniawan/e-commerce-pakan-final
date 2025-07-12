import React, { useState } from 'react';
import { Copy, Check, CreditCard, ChevronDown } from 'lucide-react';
import logoBRI from '../../assets/bri.png';
import logoBNI from '../../assets/bni.png';
import logoBCA from '../../assets/bca.png';
import './PaymentMethodDropdown.css';

// Example of how to integrate into your Checkout component:
// 1. Add state for payment method: const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
// 2. Add the component in your JSX between address section and order details
// 3. Pass the handler: <PaymentMethodDropdown onPaymentSelect={setSelectedPaymentMethod} />

const PaymentMethodDropdown = ({ onPaymentSelect }) => {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(null);

 const paymentMethods = [
    {
      id: 'bri',
      name: 'Bank BRI',
      logo: logoBRI,
      color: '#1e40af',
      accountNumber: '1234567890123',
      accountName: 'Pakan Burung Bandung',
      bankCode: 'BRI'
    },
    {
      id: 'bni',
      name: 'Bank BNI',
      logo: logoBNI,
      color: '#ea580c',
      accountNumber: '0987654321098',
      accountName: 'Pakan Burung Bandung',
      bankCode: 'BNI'
    },
    {
      id: 'bca',
      name: 'Bank BCA',
      logo: logoBCA,
      color: '#1d4ed8',
      accountNumber: '5678901234567',
      accountName: 'Pakan Burung Bandung',
      bankCode: 'BCA'
    }
  ];

  const handlePaymentSelect = (payment) => {
    setSelectedPayment(payment);
    setIsDropdownOpen(false);
    if (onPaymentSelect) {
      onPaymentSelect(payment);
    }
  };

  const copyToClipboard = async (text, accountId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAccount(accountId);
      setTimeout(() => setCopiedAccount(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedAccount(accountId);
        setTimeout(() => setCopiedAccount(null), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="payment-dropdown-container">
      <div className="payment-dropdown-content">
        <div className="payment-header">
          <h3 className="payment-title">
            Pilih Metode Pembayaran
          </h3>
          
          {/* Dropdown */}
          <div className="dropdown-wrapper">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="dropdown-button"
            >
              <span className="dropdown-selected">
                {selectedPayment ? (
                  <>
                    <img 
                      src={selectedPayment.logo} 
                      alt={selectedPayment.name}
                      className="bank-logo"
                    />
                    <span className="bank-name">{selectedPayment.name}</span>
                  </>
                ) : (
                  <span className="placeholder-text">Pilih metode pembayaran</span>
                )}
              </span>
              <ChevronDown className={`dropdown-arrow ${isDropdownOpen ? 'rotated' : ''}`} />
            </button>

            {/* Dropdown Options */}
            {isDropdownOpen && (
              <div className="dropdown-options">
                {paymentMethods.map((payment) => (
                  <button
                    key={payment.id}
                    onClick={() => handlePaymentSelect(payment)}
                    className="dropdown-option"
                  >
                    <img 
                      src={payment.logo} 
                      alt={payment.name}
                      className="option-logo"
                    />
                    <div className="option-details">
                      <div className="option-name">{payment.name}</div>
                      <div className="option-type">Transfer Bank</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment Details */}
        {/* {selectedPayment && (
          <div className="payment-details">
            <div className="payment-details-header">
        
              <div className="bank-info">
                <p className="bank-subtitle">Transfer ke no rekening berikut</p>
              </div>
            </div>

            <div className="account-details">
              <div className="account-number-card">
                <div className="account-info">
                    <p className="account-number">{selectedPayment.accountNumber}</p>
                  <button
                    onClick={() => copyToClipboard(selectedPayment.accountNumber, selectedPayment.id)}
                    className="copy-button"
                    title="Salin nomor rekening"
                  >
                    {copiedAccount === selectedPayment.id ? (
                      <Check className="copy-icon success" />
                    ) : (
                      <Copy className="copy-icon" />
                    )}
                  </button>

                </div>
              </div>

             
              {copiedAccount === selectedPayment.id && (
                <div className="copy-success-message">
                  <Check className="success-icon" />
                  Nomor rekening berhasil disalin!
                </div>
              )}

            
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default PaymentMethodDropdown;