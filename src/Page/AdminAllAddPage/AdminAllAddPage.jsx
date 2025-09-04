import React from "react";
import "./AdminAllAddPage.scss";
import { Link } from "react-router-dom";

function AdminAllAddPage() {
  return (
    <div className="admin-containerr">
      <div className="admin-header">
        <h1 className="admin-title">Əlacə etmə sistemi</h1>
        <p className="admin-subtitle">
          Bölmələrə yeni məlumatlar etmək üçün aşağıdakı seçimlərdən birini
          seçin
        </p>
      </div>
      <div className="boxes-container">
        <Link to={"tables"} className="box masalar-box">
          <div className="box-content">
            <h2>Masa əlavə et</h2>
            <p>Masaların əlavə edilməsi üçün toxun</p>
          </div>
        </Link>

        <Link to={"rooms"} className="box kabinetler-box">
          <div className="box-content">
            <h2>Kabinet əlavə et</h2>
            <p>Kabinetlərin əlavə edilməsi üçün toxun</p>
          </div>
        </Link>
        <Link to={"hotel"} className="box hotel-box">
          <div className="box-content">
            <h2>Otaq əlavə et</h2>
            <p>Otel otaqları əlavə edilməsi üçün toxun</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default AdminAllAddPage;
