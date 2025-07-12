import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Profile.css';
import GotoIcon from '../assets/GotoIcon.svg';
import { Modal } from 'antd'; // ✅ import Modal

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    Modal.confirm({
      title: 'Konfirmasi Logout',
      content: 'Apakah Anda yakin ingin logout?',
      okText: 'Oke',
      cancelText: 'Batal',
      onOk() {
        logout();
        navigate('/');
      },
    });
  };

  return (
    <div className="form">
      <div className="contain-profileImage">
        <div className="profileImage"></div>
      </div>

      <div className="profile-info">
        <h5>{currentUser.nama}</h5>
        <p>{currentUser.email}</p>
      </div>

      <div className="contain-action-menu">
        <div className="profile-actions" onClick={() => navigate('/edit-profile')}>
          <p>Edit Profile</p>
          <img src={GotoIcon} />
        </div>

        <div className="profile-actions" onClick={() => navigate('/address')}>
          <p>Alamat</p>
          <img src={GotoIcon} />
        </div>

        <div className="profile-actions" onClick={handleLogout}>
          <p>Logout</p>
          <img src={GotoIcon} />
        </div>
      </div>
    </div>
  );
};

export default Profile;
