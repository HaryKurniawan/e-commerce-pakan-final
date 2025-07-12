// components/Header.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import BackIcon from '../../assets/arrow-right.svg';
        

const Header = ({ title}) => {
  const navigate = useNavigate();

  return (
    <header className="headerr">
      <div className="header-left">
        <div onClick={() => navigate(-1)}><img src={BackIcon} /></div>
      </div>

      <div className="header-page-name">
        {title}
      </div>

      <div className="">
      </div>

      
    </header>
  );
};

export default Header;