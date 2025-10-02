import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./BasketPopUp.scss";
import axios from "axios";

const TABLES_URL = "http://172.20.5.167:8001/api/tables/";
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

function BasketPopUp({ to = "/basket", title = "Səbət", count: externalCount }) {
  const [internalCount, setInternalCount] = useState(0);
  const [reservedLock, setReservedLock] = useState(false); // yalnız seçilmiş masa üçün

  // Səbət sayını izləyir
  useEffect(() => {
    const refresh = () => {
      const arr = readBasket();
      const count = arr.reduce((sum, item) => sum + (item?.qty || 1), 0);
      setInternalCount(count);
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

  // Seçilmiş masanın reserved olub-olmadığını yoxlayır
  useEffect(() => {
    let timer;
    const checkReserved = async () => {
      const tnum = readTableNumber();
      if (!tnum) { setReservedLock(false); return; }

      try {
        const { data } = await axios.get(TABLES_URL);
        const table = Array.isArray(data)
          ? data.find((t) => Number(t?.table_num) === Number(tnum))
          : null;

        const status = String(table?.status || "").toLowerCase();
        setReservedLock(status === "reserved");
      } catch (e) {
        console.error("BasketPopUp tables check failed:", e);
        setReservedLock(false); // xəta olarsa kilid tətbiq etmirik
      }
    };

    checkReserved();

    // tableNumber dəyişəndə yenidən yoxla
    const onStorage = (e) => { if (e.key === TABLE_NUM_KEY) checkReserved(); };
    window.addEventListener("storage", onStorage);

    // periodik yenilə (30s)
    timer = setInterval(checkReserved, 30000);

    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(timer);
    };
  }, []);

  // Prop count varsa onu götür, yoxdursa internalCount
  const count = typeof externalCount === "number" ? externalCount : internalCount;

  // Masa reserved-dirsə, ümumiyyətlə göstərmə
  if (reservedLock) return null;

  return (
    <Link
      to={to}
      className="basket-box"
      aria-label={`${title}${count > 0 ? ` (${count})` : ""}`}
      title={title}
    >
      <i className="fas fa-shopping-basket" aria-hidden="true"></i>
      {count > 0 && (
        <span className="basket-badge">{count > 99 ? "99+" : count}</span>
      )}
    </Link>
  );
}

export default BasketPopUp;
