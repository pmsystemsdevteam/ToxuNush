import React, { useEffect, useMemo, useState } from "react";
import "./BasketPage.scss";
import axios from "axios";
import { baseUrl } from "../../../baseUrl";
import toast from "react-hot-toast";

const BASKET_KEY = "basket";
const BASKETS_POST_URL = "https://api.albanproject.az/api/baskets/";
const TABLES_URL = `${baseUrl}/api/tables/`; // masa statusu üçün
const SERVICE_COST = 2.5; // AZN

// ---- SƏBƏT SAXLAMA OXU/YAZ ----
const normalizeBasket = (raw) => {
  if (!Array.isArray(raw)) return [];
  if (raw.length && typeof raw[0] === "object" && raw[0] !== null) {
    return raw
      .map((x) => ({ id: x.id, quantity: Number(x.quantity ?? x.qty ?? 1) }))
      .filter((x) => typeof x.id !== "undefined" && x.quantity > 0);
  }
  return raw
    .map((id) => ({ id, quantity: 1 }))
    .filter((x) => typeof x.id !== "undefined");
};
const readBasket = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(BASKET_KEY) || "[]");
    return normalizeBasket(parsed);
  } catch {
    return [];
  }
};
const writeBasket = (basketArr) => {
  localStorage.setItem(BASKET_KEY, JSON.stringify(basketArr));
  window.dispatchEvent(new Event("basket_updated"));
};

// ---- Köməkçi: table_num -> backend table.id həlli ----
const resolveBackendTableId = async (tableNum) => {
  try {
    const res = await axios.get(TABLES_URL);
    const list = Array.isArray(res.data) ? res.data : [];
    const found = list.find((t) => Number(t.table_num) === Number(tableNum));
    return found?.id ?? null;
  } catch (e) {
    console.error("Cədvəl siyahısı alınmadı:", e);
    return null;
  }
};

function BasketPage() {
  const [basketItems, setBasketItems] = useState([]); // [{...productFields, quantity}]
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderNote, setOrderNote] = useState("");

  // Masanın nömrəsi: localStorage.lastVisitedPage məsələn "/12"
  const locationTabel = useMemo(() => {
    try {
      const raw = localStorage.getItem("lastVisitedPage") || "";
      const seg = raw.split("/")[1] || null;
      return seg && seg.trim() !== "" ? seg : null;
    } catch {
      return null;
    }
  }, []);

  // API-dən məhsulları çək, səbətdə olan id-lərə görə seç və quantity ilə birləşdir
  async function fetchProductsForBasket() {
    try {
      const basket = readBasket(); // [{id, quantity}]
      if (basket.length === 0) {
        setBasketItems([]);
        return;
      }

      const res = await axios.get(`${baseUrl}/api/products/`);
      const selected = res.data.filter((p) =>
        basket.some((b) => b.id === p.id)
      );

      const mapped = selected.map((p) => {
        const found = basket.find((b) => b.id === p.id);
        return {
          id: p.id,
          name_az: p.name_az,
          name_en: p.name_en,
          name_ru: p.name_ru,
          description_az: p.description_az,
          description_en: p.description_en,
          description_ru: p.description_ru,
          price: Number(p.cost),
          cost_str: p.cost,
          image: p.image,
          time: p.time,
          vegan: p.vegan,
          halal: p.halal,
          category: p.category,
          quantity: found?.quantity || 1,
        };
      });

      setBasketItems(mapped);
    } catch (error) {
      console.error("Məhsullar alınarkən xəta baş verdi:", error);
    }
  }

  useEffect(() => {
    fetchProductsForBasket();
    const onStorage = (e) => {
      if (e.key === BASKET_KEY) fetchProductsForBasket();
    };
    const onCustom = () => fetchProductsForBasket();
    window.addEventListener("storage", onStorage);
    window.addEventListener("basket_updated", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("basket_updated", onCustom);
    };
  }, []);

  // ---- Miqdar dəyişimi ----
  const updateQuantity = (id, newQty) => {
    setBasketItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQty } : item
      )
    );
    const basket = readBasket();
    const next = basket.map((b) =>
      b.id === id ? { ...b, quantity: newQty } : b
    );
    writeBasket(next);
  };
  const increaseQuantity = (id) => {
    const item = basketItems.find((i) => i.id === id);
    updateQuantity(id, (item?.quantity || 1) + 1);
  };
  const decreaseQuantity = (id) => {
    const item = basketItems.find((i) => i.id === id);
    if (item && item.quantity > 1) updateQuantity(id, item.quantity - 1);
  };

  // ---- Sil ----
  const removeItem = (id) => {
    setBasketItems((prev) => prev.filter((item) => item.id !== id));
    const next = readBasket().filter((b) => b.id !== id);
    writeBasket(next);
    toast("Səbətdən silindi.", {
      icon: "❌",
      style: {
        marginTop: "70px",
        borderRadius: "12px",
        height: "48px",
        fontFamily: "Times New Roman, serif",
      },
    });
  };

  // ---- Hesablamalar ----
  const subTotalNumber = basketItems.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );
  const totalTime = basketItems.reduce(
    (sum, it) => sum + (Number(it.time) || 0) * it.quantity,
    0
  );
  const totalCostNumber = subTotalNumber + SERVICE_COST;

  const calculateTotal = () => subTotalNumber.toFixed(2);
  const calculatePreparationTime = () => totalTime;

  // ---- Masa statusunu yenilə (waitingFood) ----
  const updateTableStatus = async (backendTableId, status = "waitingFood") => {
    try {
      await axios.patch(
        `${TABLES_URL}${backendTableId}/`,
        { status }, // DƏQİQ AD: "waitingFood" (boşluq YOXDUR)
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("Masa statusu yenilənmədi:", e?.response?.data || e);
      throw e; // üst səviyyəyə ötürək ki, düzgün göstərilsin
    }
  };

  // ---- POST: Təsdiqlə (table_id + masa statusu waitingFood) ----
  const handleConfirm = async () => {
    try {
      const tableNumParsed = Number.parseInt(String(locationTabel ?? ""), 10);
      if (!Number.isFinite(tableNumParsed)) {
        alert(
          "Masa nömrəsi tapılmadı. Zəhmət olmasa masa seçimi ilə yenidən daxil olun."
        );
        return;
      }

      // 1) backend table.id həll et
      const backendTableId = await resolveBackendTableId(tableNumParsed);
      toast("Sifarişiniz təsdiqləndi.", {
        icon: "✔️",
        style: {
          marginTop: "60px",
          borderRadius: "12px",
          height: "48px",
          fontFamily: "Times New Roman, serif",
        },
      });
      if (!backendTableId) {
        alert("Masa backend-də tapılmadı. Xahiş olunur, yenidən yoxlayın.");
        return;
      }

      // 2) Sifariş payload
      const payload = {
        table_id: backendTableId, // DƏYİŞİKLİK: backend table.id
        note: orderNote || "",
        service_cost: SERVICE_COST.toFixed(2),
        total_cost: totalCostNumber.toFixed(2),
        total_time: totalTime,
        items: basketItems.map((item) => ({
          product: item.id,
          count: item.quantity,
          name_az: item.name_az,
          name_en: item.name_en,
          name_ru: item.name_ru,
          description_az: item.description_az,
          description_en: item.description_en,
          description_ru: item.description_ru,
          cost: item.cost_str,
          time: item.time,
        })),
      };

      // 3) Sifarişi göndər
      await axios.post(BASKETS_POST_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });

      // 4) Masa statusunu "waitingFood" et
      await updateTableStatus(backendTableId, "waitingFood");


      // səbəti təmizlə
      localStorage.removeItem(BASKET_KEY);
      window.dispatchEvent(new Event("basket_updated"));
      setBasketItems([]);
      setShowConfirmation(false);
    } catch (err) {
      console.error("Sifariş göndərilərkən xəta:", err);
      const msg = err?.response?.data
        ? JSON.stringify(err.response.data, null, 2)
        : "Xəta baş verdi. Yenidən cəhd edin.";
      alert(msg);
    }
  };

  const confirmOrder = () => setShowConfirmation(true);
  const handleNoteChange = (e) => setOrderNote(e.target.value);

  return (
    <div className="basket-page">
      <div className="container">
        <h1 className="page-title">Səbətim</h1>

        {/* Masa məlumatı — yalnız görüntü */}
        <div className="table-info" aria-label="table-number">
          <i className="icon fas fa-chair" aria-hidden="true"></i>
          <span className="label">Masa:</span>
          <span className="value">{locationTabel ?? "-"}</span>
        </div>

        {basketItems.length === 0 ? (
          <div className="empty-basket">
            <i className="fas fa-shopping-basket"></i>
            <h2>Səbətiniz boşdur</h2>
            <p>Sifariş vermək üçün məhsul əlavə edin</p>
          </div>
        ) : (
          <>
            <div className="basket-content">
              <div className="basket-items">
                {basketItems.map((item) => (
                  <div key={item.id} className="basket-item">
                    <div className="item-image">
                      <img src={item.image} alt={item.name_az} />
                    </div>

                    <div className="item-details">
                      <h3 className="item-name">{item.name_az}</h3>
                      <p className="item-description">{item.description_az}</p>
                      <div className="item-price">
                        {item.price.toFixed(2)} AZN
                      </div>

                      {(item.vegan || item.halal) && (
                        <div className="item-tags">
                          {item.vegan && (
                            <span className="tag vegan">Vegan</span>
                          )}
                          {item.halal && (
                            <span className="tag halal">Halal</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="item-controls">
                      <div className="quantity-controls">
                        <button
                          className="quantity-btn"
                          onClick={() => decreaseQuantity(item.id)}
                          aria-label={`Reduce quantity of ${item.name_az}`}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button
                          className="quantity-btn"
                          onClick={() => increaseQuantity(item.id)}
                          aria-label={`Increase quantity of ${item.name_az}`}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>

                      <button
                        className="remove-btn"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name_az} from basket`}
                      >
                        <i className="fas fa-trash"></i>
                        Sil
                      </button>
                    </div>

                    <div className="item-total">
                      {(item.price * item.quantity).toFixed(2)} AZN
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-summary">
                <h2>Sifariş Xülasəsi</h2>

                <div className="table-info-inline">
                  <i className="fas fa-chair" aria-hidden="true"></i>
                  <span>
                    Masa: <span className="value">{locationTabel ?? "-"}</span>
                  </span>
                </div>

                <div className="summary-row">
                  <span>Məhsulun Ümumi Dəyəri:</span>
                  <span>{calculateTotal()} AZN</span>
                </div>

                <div className="summary-row">
                  <span>Servis haqqı:</span>
                  <span>{SERVICE_COST.toFixed(2)} AZN</span>
                </div>

                <div className="summary-row total">
                  <span>Ümumi Məbləğ:</span>
                  <span>{(subTotalNumber + SERVICE_COST).toFixed(2)} AZN</span>
                </div>

                <div className="preparation-time">
                  <i className="fas fa-clock"></i>
                  <span>
                    Təxmini Hazırlanma Müddəti: {calculatePreparationTime()}{" "}
                    dəqiqə
                  </span>
                </div>

                <div className="order-note">
                  <h3>Sifariş Qeydi</h3>
                  <textarea
                    value={orderNote}
                    onChange={handleNoteChange}
                    placeholder="Sifarişinizlə bağlı qeydlər..."
                    aria-label="Order notes"
                  />
                </div>

                <button className="confirm-order-btn" onClick={confirmOrder}>
                  Sifarişi Təsdiqlə
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showConfirmation && (
        <div className="confirmation-overlay">
          <div className="confirmation-modal">
            <button
              className="close-btn"
              onClick={() => setShowConfirmation(false)}
              aria-label="Close confirmation"
            >
              <i className="fas fa-times"></i>
            </button>

            <div className="modal-content">
              <div className="modal-icon">
                <i className="fas fa-check-circle"></i>
              </div>

              <h2>Sifarişi Təsdiqlə</h2>
              <p>Sifarişinizi təsdiq etmək istədiyinizə əminsiniz?</p>

              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowConfirmation(false)}
                >
                  Ləğv Et
                </button>
                <button className="confirm-btn" onClick={handleConfirm}>
                  Təsdiqlə
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BasketPage;
