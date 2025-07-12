import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/authAPI';
import Header from '../components/common/Header'
import './editprofile.css'


const EditProfile = () => {
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nama: currentUser?.nama || '',
    email: currentUser?.email || '',
    noHp: currentUser?.no_hp || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.nama.trim() || !formData.email.trim()) {
        throw new Error('Name and email are required');
      }

      // Prepare update data
      const updateData = {
        nama: formData.nama.trim(),
        email: formData.email.trim(),
        no_hp: formData.noHp.trim()
      };

      // Update user profile
      await authAPI.updateProfile(currentUser.id, updateData);
      
      // Update current user state
      updateUser(updateData);
      
      navigate('/profile');
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Error updating profile: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="form-contain">
      <Header title="Edit Profil" />

      <form onSubmit={handleSubmit} className='form-edit-profile'>
        <input
        className='input-edit-profile'
          type="text"
          name="nama"
          placeholder="Full Name"
          value={formData.nama}
          onChange={handleChange}
          required
        />
        <input
        className='input-edit-profile'
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input

        className='input-edit-profile'

          type="tel"
          name="noHp"
          placeholder="Phone Number"
          value={formData.noHp}
          onChange={handleChange}
        />

        <button className="button-edit-profile" type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
       
      </form>
    </div>
  );
};

export default EditProfile;