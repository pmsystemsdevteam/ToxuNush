import React, { useEffect, useState } from "react";
import "./Navbar.scss";
import { Link } from "react-router-dom";
import axios from "axios";

const TABLES_URL = "http://172.20.5.167:8001/api/tables/";

// Yeni açarlar
const TABLE_KEY = "table";           // t üçün
const ROOM_KEY = "room";             // r üçün
const ACTIVE_CTX_KEY = "activeContext"; // 't' | 'r'

// Köhnə səbət açarı (səndə mövcud idi)
const BASKET_KEY = "basket";

// Köməkçi: səbət sayını oxu
const readBasket = () => {
  try {
    const arr = JSON.parse(localStorage.getItem(BASKET_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

// Köməkçi: masa nömrəsini oxu (yalnız yeni açardan)
const readTableNumber = () => {
  const v = localStorage.getItem(TABLE_KEY);
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// Köməkçi: otaq nömrəsini oxu (yalnız yeni açardan)
const readRoomNumber = () => {
  const v = localStorage.getItem(ROOM_KEY);
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// Aktiv kontekstdən asılı olaraq loqo hara yönlənsin:
// 't' → `/4t`, 'r' → `/12r`, heç nə → `/`
const computeLogoTarget = () => {
  const active = (localStorage.getItem(ACTIVE_CTX_KEY) || "").toLowerCase();
  if (active === "table") {
    const n = readTableNumber();
    if (n) return `/${n}t`;
  }
  if (active === "room") {
    const n = readRoomNumber();
    if (n) return `/${n}r`;
  }
  return "/";
};

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [basketCount, setBasketCount] = useState(0);
  const [reservedLock, setReservedLock] = useState(false); // seçilmiş masa reserved-dirsə
  const [logoTo, setLogoTo] = useState(computeLogoTarget());

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

  // Loqo hədəfini LS dəyişikliklərinə reaktiv saxla
  useEffect(() => {
    const recalc = () => setLogoTo(computeLogoTarget());

    const onStorage = (e) => {
      if ([TABLE_KEY, ROOM_KEY, ACTIVE_CTX_KEY].includes(e.key)) {
        recalc();
      }
    };
    const onCtxChanged = () => recalc();

    window.addEventListener("storage", onStorage);
    window.addEventListener("ctx_changed", onCtxChanged);
    recalc(); // mount zamanı

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("ctx_changed", onCtxChanged);
    };
  }, []);

  // Seçilmiş masanın reserved olub-olmadığını yoxla (yalnız masa kontekstində məntiqlidir)
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
        setReservedLock(false);
      }
    };

    checkReserved();

    // table dəyişərsə yenidən yoxla
    const onStorage = (e) => {
      if (e.key === TABLE_KEY) checkReserved();
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
        {/* LOQO: aktiv kontekstə yönləndirir (məs: /4t, /12r). Yoxdursa “/” */}
        <Link to={logoTo} className="nav-logo-link">
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
                <Link to={logoTo} className="nav-link">Ana Səhifə</Link>
              </li>
              <li className="nav-item">
                <Link to={"/product"} className="nav-link">Məhsullar</Link>
              </li>
              <li className="nav-item">
                <Link to={"/myOrder"} className="nav-link">Sifarişlər</Link>
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
          <Link to={"/myOrder"} className="mobile-link" onClick={toggleMenu}>
            Sifarişlər
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
