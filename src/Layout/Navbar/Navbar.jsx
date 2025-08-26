import React, { useEffect, useState } from "react";
import "./Navbar.scss";
import { Link } from "react-router-dom";
import axios from "axios";

const TABLES_URL = "https://api.albanproject.az/api/tables/";
const TABLE_NUM_KEY = "tableNumber";

const BASKET_KEY = "basket";
const readBasket = () => {
  try {
    const arr = JSON.parse(localStorage.getItem(BASKET_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const readTableNumber = () => {
  const v = localStorage.getItem(TABLE_NUM_KEY);
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [basketCount, setBasketCount] = useState(0);
  const [reservedLock, setReservedLock] = useState(false); // yalnız seçilmiş masa üçün

  // Səbət sayını izləyir
  useEffect(() => {
    const refresh = () => {
      const arr = readBasket();
      const count = arr.reduce((s, i) => s + (i.qty || 1), 0);
      setBasketCount(count);
    };
    refresh();

    const onStorage = (e) => {
      if (e.key === BASKET_KEY) refresh();
    };
    const onCustom = () => refresh();

    window.addEventListener("storage", onStorage);
    window.addEventListener("basket_updated", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("basket_updated", onCustom);
    };
  }, []);

  // Seçilmiş masanın reserved olub-olmadığını yoxlayır
  useEffect(() => {
    let timer;
    const checkReserved = async () => {
      const tnum = readTableNumber();
      if (!tnum) {
        setReservedLock(false);
        return;
      }
      try {
        const { data } = await axios.get(TABLES_URL);
        const table = Array.isArray(data)
          ? data.find((t) => Number(t?.table_num) === Number(tnum))
          : null;
        const status = String(table?.status || "").toLowerCase();
        setReservedLock(status === "reserved");
      } catch (e) {
        console.error("Navbar tables check failed:", e);
        setReservedLock(false); // xəta halında kilid tətbiq etmirik
      }
    };

    checkReserved();

    // tableNumber dəyişərsə yenidən yoxla
    const onStorage = (e) => {
      if (e.key === TABLE_NUM_KEY) checkReserved();
    };
    window.addEventListener("storage", onStorage);

    // periodik yenilə (30s)
    timer = setInterval(checkReserved, 30000);

    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(timer);
    };
  }, []);

  // reservedLock aktivləşəndə hamburgeri bağla
  useEffect(() => {
    if (reservedLock) setIsMenuOpen(false);
  }, [reservedLock]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className={`navbar ${reservedLock ? "reserved-lock" : ""}`}>
      {/* reservedLock olduqda loqonu tam mərkəzdə göstəririk */}
      <div
        className="nav-container"
        style={{ justifyContent: reservedLock ? "center" : "space-between" }}
      >
        <Link to={"/"} className="nav-logo-link">
          <div className="nav-logo">
            {reservedLock ? (
              // reserved: yalnız mətn loqo
              <span>ToxuNush</span>
            ) : (
              <>
                <i className="fas fa-utensils"></i>
                <span>ToxuNush</span>
              </>
            )}
          </div>
        </Link>

        {/* reserved olduqda naviqasiya elementlərini ümumiyyətlə render ETMƏ */}
        {!reservedLock && (
          <>
            <ul className="nav-menu">
              <li className="nav-item">
                <Link to={"/"} className="nav-link">Ana Səhifə</Link>
              </li>
              <li className="nav-item">
                <Link to={"/product"} className="nav-link">Məhsullar</Link>
              </li>
              <li className="nav-item">
                <Link to={"/basket"} className="nav-link basket-link">
                  <i className="fas fa-shopping-basket"></i>
                  {basketCount > 0 && (
                    <span className="basket-count">{basketCount}</span>
                  )}
                </Link>
              </li>
            </ul>

            <div className="menu-toggle" onClick={toggleMenu}>
              <span className={isMenuOpen ? "bar open" : "bar"}></span>
              <span className={isMenuOpen ? "bar open" : "bar"}></span>
              <span className={isMenuOpen ? "bar open" : "bar"}></span>
            </div>
          </>
        )}
      </div>

      {/* reserved olduqda mobil menyunu da göstərmə */}
      {!reservedLock && (
        <div className={`mobile-menu ${isMenuOpen ? "active" : ""}`}>
          <Link to={"/"} className="mobile-link" onClick={toggleMenu}>
            Ana Səhifə
          </Link>
          <Link to={"/product"} className="mobile-link" onClick={toggleMenu}>
            Məhsullar
          </Link>
          <Link to={"/basket"} className="mobile-link" onClick={toggleMenu}>
            Səbət
            {basketCount > 0 && (
              <span className="mobile-basket-count">{basketCount}</span>
            )}
          </Link>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
