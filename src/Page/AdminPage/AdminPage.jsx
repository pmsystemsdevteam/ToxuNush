import React from "react";
import "./AdminPage.scss";
import { Link } from "react-router-dom";

function AdminPage() {
  return (
    <div className="admin-containerr">
      <div className="admin-header">
        <h1 className="admin-title">İdarəetmə Sistemi</h1>
        <p className="admin-subtitle">
          Bölmələri idarə etmək üçün aşağıdakı seçimlərdən birini seçin
        </p>
      </div>

      <div className="boxes-container">
        <Link to={"tables"} className="box masalar-box">
          <div className="box-content">
            <h2>Masalar</h2>
            <p>Masaların idarə edilməsi üçün daxil ol</p>
          </div>
          <div className="box-hover-effect"></div>
        </Link>

        <Link to={"rooms"} className="box kabinetler-box">
          <div className="box-content">
            <h2>Kabinetlər</h2>
            <p>Kabinetlərin idarə edilməsi üçün daxil ol</p>
          </div>
          <div className="box-hover-effect"></div>
        </Link>

        <Link to={"hotel"} className="box hotel-box">
          <div className="box-content">
            <h2>Otaqlar</h2>
            <p>Otel otaqlarının idarə edilməsi üçün daxil ol</p>
          </div>
          <div className="box-hover-effect"></div>
        </Link>
      </div>
    </div>
  );
}

export default AdminPage;
