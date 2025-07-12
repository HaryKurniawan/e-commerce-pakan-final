import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/authAPI';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      navigate(currentUser.role === 'ADMIN' ? '/admin' : '/');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form data
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      console.log('Attempting login with:', formData.email);
      
      const userData = await authAPI.login({
        email: formData.email,
        password: formData.password
      });
      
      console.log('Login successful, user data:', userData);
      
      if (!userData) {
        throw new Error('Login failed: No user data received');
      }
      
      login(userData);
      
      // Navigate based on user role
      const redirectPath = userData.role === 'ADMIN' ? '/admin' : '/';
      navigate(redirectPath);
      
      // Show success message
      alert('Login successful!');
      
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      // Handle specific error types
      if (error.message.includes('verify your email') || 
          error.message.includes('email_confirmed_at') ||
          error.message.includes('email not confirmed')) {
        errorMessage = 'Please verify your email before logging in. Check your inbox for a confirmation email.';
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message.includes('Account not found')) {
        errorMessage = 'Account not found. Please register first or check your email address.';
      } else if (error.message.includes('Multiple accounts found')) {
        errorMessage = 'Multiple accounts found with this email. Please contact support.';
      } else if (error.message.includes('Failed to fetch user profile')) {
        errorMessage = 'Unable to load user profile. Please try again.';
      } else if (error.message.includes('Please fill in all fields')) {
        errorMessage = 'Please fill in all fields.';
      } else if (error.message.includes('valid email address')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      // Only show alert for non-validation errors
      if (!error.message.includes('Please fill in all fields') && 
          !error.message.includes('valid email address')) {
        alert('Error: ' + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-form-container">
      <h2>Login</h2>
      {error && (
        <div className="error-message" style={{ 
          color: 'red', 
          marginBottom: '1rem', 
          padding: '0.5rem', 
          border: '1px solid red', 
          borderRadius: '4px',
          backgroundColor: '#ffebee'
        }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <input
          className="login-input-field"
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />
        <div className="login-password-wrapper">
          <input
            className="login-input-field login-password-field"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="login-password-visibility-toggle"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.45703 12C3.73128 7.94291 7.52159 5 12 5C16.4784 5 20.2687 7.94291 21.543 12C20.2687 16.0571 16.4784 19 12 19C7.52159 19 3.73128 16.0571 2.45703 12Z" stroke="#666" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="2"/>
              </svg>
            )}
          </button>
        </div>
        
        <Link to="/forgot-password" className="login-forgot-password-link">
          Lupa password?
        </Link>

        <button className="login-submit-btn" type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
      
      <div className="login-register-prompt">
        Belum punya akun? <Link to="/register" className="login-register-link">Daftar</Link>
      </div>
    </div>
  );
};

export default Login;