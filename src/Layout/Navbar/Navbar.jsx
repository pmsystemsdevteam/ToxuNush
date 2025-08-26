import React, { useEffect, useState } from "react";
import "./Navbar.scss";
import { Link } from "react-router-dom";

const BASKET_KEY = "basket";
const readBasket = () => {
  try {
    const arr = JSON.parse(localStorage.getItem(BASKET_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
};

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [basketCount, setBasketCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      const arr = readBasket();
      const count = arr.reduce((s, i) => s + (i.qty || 1), 0);
      setBasketCount(count);
    };
    refresh();
    const onStorage = (e) => { if (e.key === BASKET_KEY) refresh(); };
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("basket_updated", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("basket_updated", onCustom);
    };
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to={"/"} className="nav-logo-link">
          <div className="nav-logo">
            <i className="fas fa-utensils"></i>
            <span>PMS Food</span>
          </div>
        </Link>

        <ul className="nav-menu">
          <li className="nav-item"><Link to={"/"} className="nav-link">Ana Səhifə</Link></li>
          <li className="nav-item"><Link to={"/product"} className="nav-link">Məhsullar</Link></li>
          <li className="nav-item">
            <Link to={"/basket"} className="nav-link basket-link">
              <i className="fas fa-shopping-basket"></i>
              {basketCount > 0 && <span className="basket-count">{basketCount}</span>}
            </Link>
          </li>
        </ul>

        <div className="menu-toggle" onClick={toggleMenu}>
          <span className={isMenuOpen ? "bar open" : "bar"}></span>
          <span className={isMenuOpen ? "bar open" : "bar"}></span>
          <span className={isMenuOpen ? "bar open" : "bar"}></span>
        </div>
      </div>

      <div className={`mobile-menu ${isMenuOpen ? "active" : ""}`}>
        <Link to={"/"} className="mobile-link" onClick={toggleMenu}>Ana Səhifə</Link>
        <Link to={"/product"} className="mobile-link" onClick={toggleMenu}>Məhsullar</Link>
        <Link to={"/basket"} className="mobile-link" onClick={toggleMenu}>
          Səbət {basketCount > 0 && <span className="mobile-basket-count">{basketCount}</span>}
        </Link> 
      </div>
    </nav>
  );
}

export default Navbar;
