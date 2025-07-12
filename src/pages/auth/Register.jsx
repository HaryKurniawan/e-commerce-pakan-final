import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/authAPI';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    noHp: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationStep, setRegistrationStep] = useState('form'); // 'form' or 'verify'
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      navigate(currentUser.role === 'ADMIN' ? '/admin' : '/');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }
    
    setLoading(true);

    try {
      const result = await authAPI.register({
        nama: formData.nama,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        noHp: formData.noHp
      });
      
      if (result.needsEmailConfirmation) {
        setRegisteredEmail(formData.email);
        setRegistrationStep('verify');
        alert('Registration successful! Please check your email to verify your account.');
      } else {
        // If email is already confirmed (shouldn't happen with new registrations)
        alert('Registration successful! You can now login.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    try {
      await authAPI.resendEmailConfirmation(registeredEmail);
      alert('Confirmation email sent! Please check your inbox.');
    } catch (error) {
      console.error('Resend error:', error);
      alert('Error resending email: ' + error.message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBackToForm = () => {
    setRegistrationStep('form');
    setRegisteredEmail('');
  };

  // Email verification step
  if (registrationStep === 'verify') {
    return (
      <div className="register-main-container">
        <div className="email-verification-container">
          <div className="email-verification-icon">
            <Mail size={64} color="#4CAF50" />
          </div>
          
          <h3>Verify Your Email</h3>
          
          <p className="verification-message">
            We've sent a confirmation email to:
            <br />
            <strong>{registeredEmail}</strong>
          </p>
          
          <p className="verification-instructions">
            Please check your email and click the confirmation link to complete your registration.
          </p>
          
          <div className="verification-actions">
            <button 
              onClick={handleResendEmail}
              disabled={resendLoading}
              className="resend-email-btn"
            >
              {resendLoading ? (
                <>
                  <RefreshCw size={16} className="spinning" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Resend Email
                </>
              )}
            </button>
            
            <button 
              onClick={handleBackToForm}
              className="back-to-form-btn"
            >
              Back to Form
            </button>
          </div>
          
          <div className="verification-footer">
            <p>
              After verifying your email, you can{' '}
              <Link to="/login" className="login-link">
                login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Registration form step
  return (
    <div className="register-main-container">
      <h3>Register</h3>

      <form className='register-form-wrapper' onSubmit={handleSubmit}>
        <input 
          className="register-text-field" 
          type="text" 
          name="nama" 
          placeholder="Full Name" 
          value={formData.nama} 
          onChange={handleChange} 
          required 
        />
        
        <input 
          className="register-text-field" 
          type="text" 
          name="username" 
          placeholder="Username" 
          value={formData.username} 
          onChange={handleChange} 
          required 
        />
        
        <input 
          className="register-text-field" 
          type="email" 
          name="email" 
          placeholder="Email" 
          value={formData.email} 
          onChange={handleChange} 
          required 
        />
        
        <div className="register-password-field-wrapper">
          <input 
            className="register-password-input" 
            type={showPassword ? "text" : "password"} 
            name="password" 
            placeholder="Password (min. 6 characters)" 
            value={formData.password} 
            onChange={handleChange} 
            required 
            minLength="6"
          />
          <button 
            type="button" 
            className="register-password-visibility-btn" 
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="register-password-field-wrapper">
          <input 
            className="register-password-input" 
            type={showConfirmPassword ? "text" : "password"} 
            name="confirmPassword" 
            placeholder="Confirm Password" 
            value={formData.confirmPassword} 
            onChange={handleChange} 
            required 
          />
          <button 
            type="button" 
            className="register-password-visibility-btn" 
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <input 
          className="register-text-field" 
          type="tel" 
          name="noHp" 
          placeholder="Phone Number" 
          value={formData.noHp} 
          onChange={handleChange} 
          required 
        />
        
        <button 
          className="register-submit-button" 
          type="submit" 
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      <p className='register-login-redirect'>
        Already have account? <Link to="/login"><b>Login here</b></Link>
      </p>
    </div>
  );
};

export default Register;