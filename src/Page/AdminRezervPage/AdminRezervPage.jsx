import React from 'react';
import './AdminRezervPage.scss';
import { Link } from 'react-router-dom';


function AdminRezervPage() {
  return (
    <div className="admin-containerr">
      <div className="admin-header">
        <h1 className="admin-title">İdarəetmə Sistemi</h1>
        <p className="admin-subtitle">
          Bölmələri idarə etmək üçün aşağıdakı seçimlərdən birini seçin
        </p>
      </div>
      <div className="boxes-container">
        <Link to={'tables'} className="box masalar-box">
          <div className="box-content">
            <h2>Masa rezerv</h2>
            <p>Masaların rezervlərinin idarə edilməsi üçün daxil ol</p>
          </div>
        </Link>
        
        <Link to={'rooms'} className="box kabinetler-box">
          <div className="box-content">
            <h2>Kabinet rezerv</h2>
            <p>Kabinetlərin rezervlərinin idarə edilməsi üçün daxil ol</p>
          </div>
        </Link>
       
      </div>
    </div>
  );
}

export default AdminRezervPage;