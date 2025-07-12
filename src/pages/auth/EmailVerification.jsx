import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../services/baseApi';
import { authAPI } from '../../services/authAPI';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the token from URL parameters
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        if (!token || type !== 'signup') {
          setStatus('error');
          setMessage('Invalid verification link.');
          return;
        }

        // Verify the email with Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          // Create user profile in your database if it doesn't exist
          try {
            await authAPI.createUserProfile(data.user);
          } catch (profileError) {
            // Profile might already exist, ignore this error
            console.log('Profile creation error (might already exist):', profileError);
          }

          setStatus('success');
          setMessage('Email verified successfully! You can now login.');
          
          // Redirect to login page after a delay
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage('Email verification failed. Please try again.');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage(error.message || 'Email verification failed. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="email-verification-page">
      <div className="verification-container">
        <div className="verification-icon">
          {status === 'verifying' && <Loader size={64} className="spinning" color="#2196F3" />}
          {status === 'success' && <CheckCircle size={64} color="#4CAF50" />}
          {status === 'error' && <XCircle size={64} color="#f44336" />}
        </div>
        
        <h2 className="verification-title">
          {status === 'verifying' && 'Verifying Email'}
          {status === 'success' && 'Email Verified'}
          {status === 'error' && 'Verification Failed'}
        </h2>
        
        <p className="verification-message">
          {message}
        </p>
        
        {status === 'success' && (
          <div className="verification-success-actions">
            <p className="redirect-notice">
              Redirecting to login page in 3 seconds...
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="login-now-btn"
            >
              Login Now
            </button>
          </div>
        )}
        
        {status === 'error' && (
          <div className="verification-error-actions">
            <button 
              onClick={() => navigate('/register')}
              className="register-again-btn"
            >
              Register Again
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="back-to-login-btn"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;