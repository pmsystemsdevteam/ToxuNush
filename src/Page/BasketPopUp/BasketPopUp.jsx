import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./BasketPopUp.scss";

const BASKET_KEY = "basket";
const readBasket = () => {
  try {
    const arr = JSON.parse(localStorage.getItem(BASKET_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

function BasketPopUp({ to = "/basket", title = "Səbət", count: externalCount }) {
  const [internalCount, setInternalCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      const arr = readBasket();
      const count = arr.reduce((sum, item) => sum + (item?.qty || 1), 0);
      setInternalCount(count);
    };

    // ilk yükləmə
    refresh();

    // localStorage dəyişəndə
    const onStorage = (e) => {
      if (e.key === BASKET_KEY) refresh();
    };

    // tətbiq içindən manual trigger üçün: window.dispatchEvent(new Event("basket_updated"))
    const onCustom = () => refresh();

    window.addEventListener("storage", onStorage);
    window.addEventListener("basket_updated", onCustom);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("basket_updated", onCustom);
    };
  }, []);

  // Əgər prop kimi count göndərsən, o prioritet olacaq; yoxdursa internalCount işləyəcək
  const count = typeof externalCount === "number" ? externalCount : internalCount;

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
