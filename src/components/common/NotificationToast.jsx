import React from 'react';
import './NotificationToast.css';

const NotificationToast = ({ show, type, message }) => {
  if (!show) return null;

  return (
    <div className={`notification-toast ${type} ${show ? 'show' : ''}`}>
      <div className="notification-content">
        <div className="notification-icon">
          {type === 'success' ? '✅' : '❌'}
        </div>
        <div className="notification-message">
          {message}
        </div>
      </div>
      <div className="notification-progress">
        <div className="progress-bar"></div>
      </div>
    </div>
  );
};

export default NotificationToast;