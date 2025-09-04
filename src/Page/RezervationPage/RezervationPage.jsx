import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./RezervationPage.scss";

const RezervationPage = () => {
  const [activeBox, setActiveBox] = useState(null);

  return (
    <div className="rezervation-page">
      <div className="rezervation-container">
        <div className="boxes-container">
          <Link
            to="table"
            className={`reservation-box masa-box ${
              activeBox === "masa" ? "active" : ""
            }`}
            onMouseEnter={() => setActiveBox("masa")}
            onMouseLeave={() => setActiveBox(null)}
          >
            <div className="box-content">
              <h2>Masa Rezerv Et</h2>
              <p>Masa rezerv etmək üçün toxun</p>
            </div>
          </Link>

          <Link
            to="room"
            className={`reservation-box kabinet-box ${
              activeBox === "kabinet" ? "active" : ""
            }`}
            onMouseEnter={() => setActiveBox("kabinet")}
            onMouseLeave={() => setActiveBox(null)}
          >
            <div className="box-content">
              <h2>Kabinet Rezerv Et</h2>
              <p>Kabinet rezerv etmək üçün toxun</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RezervationPage;
