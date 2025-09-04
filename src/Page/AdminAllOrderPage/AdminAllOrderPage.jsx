import React from "react";
import "./AdminAllOrderPage.scss";
import { Link } from "react-router-dom";

function AdminAllOrderPage() {
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
            <h2>Masa Sifarişləri</h2>
            <p>Masaların sifarişlərinə nəzət yetirmək üçün toxun</p>
          </div>
        </Link>

        <Link to={"rooms"} className="box kabinetler-box">
          <div className="box-content">
            <h2>Kabinet Sifarişləri</h2>
            <p>Kabinetlərin sifarişlərinə nəzət yetirmək üçün toxun</p>
          </div>
        </Link>
        <Link to={"hotel"} className="box hotel-box">
          <div className="box-content">
            <h2>Otaq Sifarişləri</h2>
            <p>Otel otaqlarının sifarişlərinə nəzət yetirmək üçün toxun</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default AdminAllOrderPage;
