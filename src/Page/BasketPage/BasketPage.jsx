import React, { useEffect, useRef, useState } from "react";
import "./BasketPage.scss";
import axios from "axios";
import { baseUrl } from "../../../BaseUrl";
import toast from "react-hot-toast";

// ==== Kontekst açarları ====
//  - /4t → localStorage.activeContext = "table", localStorage.table = "4"
//  - /4r → localStorage.activeContext = "room",  localStorage.room  = "4"
const ACTIVE_CTX_KEY = "activeContext"; // "table" | "room" (fallback: "t" | "r")
const TABLE_KEY = "table";              // "4"
const ROOM_KEY = "room";                // "4"

// ==== Endpoints ====
// Məhsullar, cədvəllər və otaqlar baseUrl-dən
const PRODUCTS_URL = `${baseUrl}/api/products/`;
const TABLES_URL   = `${baseUrl}/api/tables/`;
const ROOMS_URL    = `${baseUrl}/api/rooms/`;

// YENİ: Otel otaqları (hotel-room-number)
const HOTEL_ROOMS_URL = "http://192.168.0.164:8000/api/hotel-room-number/";

// Sifariş POST-ları
const TABLE_BASKETS_POST_URL = "http://192.168.0.164:8000/api/baskets/";
// const ROOM_BASKETS_POST_URL  = "http://192.168.0.164:8000/api/room-baskets/"; // istifadə etmirik
const ROOM_ORDERED_POST_URL  = "http://192.168.0.164:8000/api/room-ordered/";   // yeni API (hotel_room tələb edir)

// ==== Səbət açarı və servis haqqı ====
const BASKET_KEY = "basket";
const SERVICE_COST = 2.5; // AZN

// ---- Pul dəyərini API üçün "xx.xx" string et ----
const formatMoney = (v) => (Number(v) || 0).toFixed(2);

// ---- boş/whitespace stringləri null-a çevir ----
const sanitizeOrNull = (v) => {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
};

// ---- localStorage-dən customer tam adını qur (ad + soyad) ----
const getCustomerName = (c) => {
  const f = (c?.firstName || "").trim();
  const l = (c?.lastName || "").trim();
  const full = [f, l].filter(Boolean).join(" ");
  return full.length ? full : null;
};

// ---- Helpers: LS oxu ----
const readBooleanLS = (key, def = false) => {
  const raw = (localStorage.getItem(key) || "").toLowerCase().trim();
  if (["true", "1", "yes"].includes(raw)) return true;
  if (["false", "0", "no"].includes(raw)) return false;
  return def;
};
const readCustomerData = () => {
  try {
    const raw = localStorage.getItem("customerData");
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return {
      firstName: obj?.firstName ?? "",
      lastName: obj?.lastName ?? "",
      phone: obj?.phone ?? "",
      reservation: !!obj?.reservation,
      roomNumber: obj?.roomNumber ?? "",
    };
  } catch {
    return null;
  }
};

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

// ---- Kontekst oxu (table/room) ----
const readContext = () => {
  const raw = (localStorage.getItem(ACTIVE_CTX_KEY) || "").toLowerCase();
  const kind =
    raw === "table" || raw === "t" ? "table" :
    raw === "room"  || raw === "r" ? "room"  : null;
  if (kind === "table") {
    const n = Number(localStorage.getItem(TABLE_KEY));
    return Number.isInteger(n) && n > 0 ? { kind, number: n } : { kind: null, number: null };
  }
  if (kind === "room") {
    const n = Number(localStorage.getItem(ROOM_KEY));
    return Number.isInteger(n) && n > 0 ? { kind, number: n } : { kind: null, number: null };
  }
  return { kind: null, number: null };
};

// ---- Köməkçi: table_num -> backend table.id ----
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

// ---- Köməkçi: room_num -> backend room.id (RESTORAN otaqları üçün; hotel deyil) ----
const resolveBackendRoomId = async (roomNum) => {
  try {
    const res = await axios.get(ROOMS_URL);
    const list = Array.isArray(res.data) ? res.data : [];
    const found = list.find((r) => Number(r.room_num) === Number(roomNum));
    return found?.id ?? null;
  } catch (e) {
    console.error("Otaq siyahısı alınmadı:", e);
    return null;
  }
};

// ---- YENİ: hotel-room-number API-dən hotel otağı id həll et ----
const resolveBackendHotelRoomId = async (roomNumber) => {
  try {
    const res = await axios.get(HOTEL_ROOMS_URL);
    const list = Array.isArray(res.data) ? res.data : [];
    const found = list.find((r) => Number(r.number) === Number(roomNumber));
    return found?.id ?? null;
  } catch (e) {
    console.error("Hotel otaq siyahısı alınmadı:", e);
    return null;
  }
};

// ---- Masa statusunu yenilə (waitingFood) ----
const updateTableStatus = async (backendTableId, status = "waitingFood") => {
  try {
    await axios.patch(
      `${TABLES_URL}${backendTableId}/`,
      { status },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Masa statusu yenilənmədi:", e?.response?.data || e);
    throw e;
  }
};

function BasketPage() {
  const [basketItems, setBasketItems] = useState([]); // [{...productFields, quantity}]
  const [allProducts, setAllProducts] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [otherProducts, setOtherProducts] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderNote, setOrderNote] = useState("");

  // roomOrder rejimi & customer
  const [roomOrderMode, setRoomOrderMode] = useState(() => readBooleanLS("roomOrder", false));
  const [customer, setCustomer] = useState(() => readCustomerData());

  // Kontekst: 'table' | 'room' və nömrə (standart axın)
  const [ctx, setCtx] = useState(() => readContext());
  const contextIsTable = ctx?.kind === "table";
  const contextIsRoom  = ctx?.kind === "room";
  const contextNumber  = ctx?.number ?? null;

  // Göstəriləcək “kontekst” (roomOrderMode varsa, customer.roomNumber prioritetdir)
  const displayIsRoom = roomOrderMode ? true : contextIsRoom;
  const displayIsTable = roomOrderMode ? false : contextIsTable;
  const displayNumber = roomOrderMode
    ? (customer?.roomNumber ?? null)
    : (contextNumber ?? null);

  // ===== Məhsulları yüklə və səbətlə birləşdir =====
  async function fetchProductsForBasket() {
    try {
      const basket = readBasket(); // [{id, quantity}]
      const res = await axios.get(PRODUCTS_URL);
      const products = Array.isArray(res.data) ? res.data : [];
      setAllProducts(products);

      if (basket.length === 0) {
        setBasketItems([]);
        return;
      }

      const selected = products.filter((p) => basket.some((b) => b.id === p.id));

      const mapped = selected.map((p) => {
        const found = basket.find((b) => b.id === p.id);
        const priceNum = Number(p.cost);
        return {
          id: p.id,
          name_az: p.name_az,
          name_en: p.name_en,
          name_ru: p.name_ru,
          description_az: p.description_az,
          description_en: p.description_en,
          description_ru: p.description_ru,
          price: Number.isFinite(priceNum) ? priceNum : 0,
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

    // səbət + kontekst + roomOrder/customer dinləyiciləri
    const onStorage = (e) => {
      if (e.key === BASKET_KEY) fetchProductsForBasket();
      if ([ACTIVE_CTX_KEY, TABLE_KEY, ROOM_KEY].includes(e.key)) {
        setCtx(readContext());
      }
      if (e.key === "roomOrder") setRoomOrderMode(readBooleanLS("roomOrder", false));
      if (e.key === "customerData") setCustomer(readCustomerData());
    };
    const onBasketCustom = () => fetchProductsForBasket();
    const onCtxChanged = () => setCtx(readContext());

    window.addEventListener("storage", onStorage);
    window.addEventListener("basket_updated", onBasketCustom);
    window.addEventListener("ctx_changed", onCtxChanged);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("basket_updated", onBasketCustom);
      window.removeEventListener("ctx_changed", onCtxChanged);
    };
  }, []);

  // ===== Əlaqəli və digər məhsullar =====
  useEffect(() => {
    if (!allProducts.length) {
      setRelatedProducts([]);
      setOtherProducts([]);
      return;
    }

    const basketIds = new Set(basketItems.map((i) => i.id));
    const categoryFreq = {};
    for (const it of basketItems) {
      const c = it.category;
      if (c == null) continue;
      categoryFreq[c] = (categoryFreq[c] || 0) + it.quantity;
    }

    const scored = allProducts
      .filter((p) => !basketIds.has(p.id))
      .map((p) => ({
        product: p,
        score: categoryFreq[p.category] || 0,
      }))
      .sort(
        (a, b) =>
          b.score - a.score ||
          (a.product.name_az || "").localeCompare(b.product.name_az || "")
      );

    const REL_LIMIT = 12;
    const related = scored.filter((x) => x.score > 0).slice(0, REL_LIMIT).map((x) => x.product);

    const OTHER_LIMIT = 12;
    const usedIds = new Set(related.map((p) => p.id));
    const others = scored.filter((x) => !usedIds.has(x.product.id)).slice(0, OTHER_LIMIT).map((x) => x.product);

    setRelatedProducts(related);
    setOtherProducts(others);
  }, [allProducts, basketItems]);

  // ===== Miqdar dəyişimi =====
  const updateQuantity = (id, newQty) => {
    setBasketItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item)));
    const basket = readBasket();
    const next = basket.map((b) => (b.id === id ? { ...b, quantity: newQty } : b));
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

  // ===== Sil =====
  const removeItem = (id) => {
    setBasketItems((prev) => prev.filter((item) => item.id !== id));
    const next = readBasket().filter((b) => b.id !== id);
    writeBasket(next);
    toast("Səbətdən silindi.", {
      icon: "❌",
      style: { marginTop: "70px", borderRadius: "12px", height: "48px", fontFamily: "Times New Roman, serif" },
    });
  };

  // ===== Hesablamalar =====
  const subTotalNumber = basketItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const totalTime      = basketItems.reduce((sum, it) => sum + (Number(it.time) || 0) * it.quantity, 0);
  const calculateTotal = () => subTotalNumber.toFixed(2);
  const calculatePreparationTime = () => totalTime;

  // ===== Sifarişi təsdiqlə (POST) =====
  const handleConfirm = async () => {
    try {
      if (!basketItems.length) {
        alert("Səbət boşdur.");
        return;
      }

      // Səbət maddələri (id göndərmirik)
      const items = basketItems.map((item) => ({
        product: item.id,
        count: item.quantity,
        name_az: item.name_az ?? "",
        name_en: item.name_en ?? "",
        name_ru: item.name_ru ?? "",
        description_az: item.description_az ?? "",
        description_en: item.description_en ?? "",
        description_ru: item.description_ru ?? "",
        cost: formatMoney(item.price), // API string istəyir
        time: Number(item.time) || 0,
      }));

      // Ümumi dəyərlər
      const totalCostStr = formatMoney(subTotalNumber + SERVICE_COST);
      const serviceCostStr = formatMoney(SERVICE_COST);

      // Local müştəri məlumatı
      const c = readCustomerData();
      const phoneValue = sanitizeOrNull(c?.phone);   // "" → null
      const customerName = getCustomerName(c);       // "ali ali" | null

      // === 1) ROOM ORDER MODE (müştəri formu ilə) ===
      if (roomOrderMode) {
        if (!c?.roomNumber) {
          alert("Otaq nömrəsi tapılmadı (customerData.roomNumber). Xahiş olunur, məlumatları doldurun.");
          return;
        }

        // YENİ: hotel otağı id-ni həll et və 'hotel_room' kimi göndər
        const hotelRoomId = await resolveBackendHotelRoomId(c.roomNumber);
        if (!hotelRoomId) {
          alert("Hotel otaq backend-də tapılmadı. Xahiş olunur, nömrəni yoxlayın.");
          return;
        }

        const payload = {
          hotel_room: hotelRoomId,                 // <<< MÜTLƏQ: backend bunu tələb edir
          customer: customerName,                  // ad + soyad (string və ya null)
          phone: phoneValue,                       // boşdursa null
          note: (orderNote || "").trim(),          // yalnız istifadəçi qeydi
          service_cost: serviceCostStr,
          total_cost: totalCostStr,
          total_time: totalTime,
          items,
        };

        await axios.post(ROOM_ORDERED_POST_URL, payload, {
          headers: { "Content-Type": "application/json" },
        });

        toast("Otaq sifarişiniz təsdiqləndi.", {
          icon: "✔️",
          style: { marginTop: "60px", borderRadius: "12px", height: "48px", fontFamily: "Times New Roman, serif" },
        });

        localStorage.removeItem(BASKET_KEY);
        window.dispatchEvent(new Event("basket_updated"));
        setBasketItems([]);
        setShowConfirmation(false);
        setOrderNote("");
        return;
      }

      // === 2) NFC KONTEXTİ (table | room) ===
      const { kind, number } = ctx || {};
      if (!kind || !number) {
        alert("Masa/Otaq nömrəsi tapılmadı. Zəhmət olmasa NFC linkindən daxil olun.");
        return;
      }

      let backendId = null;

      if (kind === "table") {
        // restoran masaları üçün köhnə endpoint
        backendId = await resolveBackendTableId(number);
        if (!backendId) {
          alert("Masa backend-də tapılmadı. Xahiş olunur, yenidən yoxlayın.");
          return;
        }

        const payload = {
          table_id: backendId,
          note: (orderNote || "").trim(),        // yalnız istifadəçi qeydi
          service_cost: serviceCostStr,
          total_cost: totalCostStr,
          total_time: totalTime,
          items,
        };
        await axios.post(TABLE_BASKETS_POST_URL, payload, { headers: { "Content-Type": "application/json" } });

        try { await updateTableStatus(backendId, "waitingFood"); } catch {}
      }

      if (kind === "room") {
        // NFC ilə otaq → bu artıq HOTEL otağıdır, ona görə hotel_room göndəririk
        const hotelRoomId = await resolveBackendHotelRoomId(number);
        if (!hotelRoomId) {
          alert("Hotel otaq backend-də tapılmadı. Xahiş olunur, nömrəni yoxlayın.");
          return;
        }

        const payload = {
          hotel_room: hotelRoomId,                // <<< MÜTLƏQ
          customer: customerName,                 // string və ya null
          phone: phoneValue,                      // null ola bilər
          note: (orderNote || "").trim(),         // yalnız istifadəçi qeydi
          service_cost: serviceCostStr,
          total_cost: totalCostStr,
          total_time: totalTime,
          items,
        };
        await axios.post(ROOM_ORDERED_POST_URL, payload, { headers: { "Content-Type": "application/json" } });
      }

      toast("Sifarişiniz təsdiqləndi.", {
        icon: "✔️",
        style: { marginTop: "60px", borderRadius: "12px", height: "48px", fontFamily: "Times New Roman, serif" },
      });

      localStorage.removeItem(BASKET_KEY);
      window.dispatchEvent(new Event("basket_updated"));
      setBasketItems([]);
      setShowConfirmation(false);
      setOrderNote("");
    } catch (err) {
      console.error("Sifariş göndərilərkən xəta:", err);
      const msg = err?.response?.data ? JSON.stringify(err.response.data, null, 2) : "Xəta baş verdi. Yenidən cəhd edin.";
      alert(msg);
    }
  };

  // ===== Tövsiyələrdən səbətə əlavə et =====
  const addFromSuggestion = (prod) => {
    const basket = readBasket();
    const idx = basket.findIndex((b) => b.id === prod.id);
    let next = [...basket];
    if (idx >= 0) next[idx] = { ...next[idx], quantity: (next[idx].quantity || 1) + 1 };
    else next.push({ id: prod.id, quantity: 1 });
    writeBasket(next);
    toast("Səbətə əlavə edildi", {
      icon: "🧺",
      style: { marginTop: "70px", borderRadius: "12px", height: "48px", fontFamily: "Times New Roman, serif" },
    });
    fetchProductsForBasket();
  };

  // ===== Karusel scroll idarəsi =====
  const relatedRef = useRef(null);
  const otherRef = useRef(null);
  const [relCanLeft, setRelCanLeft] = useState(false);
  const [relCanRight, setRelCanRight] = useState(false);
  const [othCanLeft, setOthCanLeft] = useState(false);
  const [othCanRight, setOthCanRight] = useState(false);

  const updateButtonsFor = (el, setL, setR) => {
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setL(el.scrollLeft > 0);
    setR(el.scrollLeft < max - 1);
  };
  useEffect(() => {
    const relEl = relatedRef.current;
    const othEl = otherRef.current;

    const onRelScroll = () => updateButtonsFor(relEl, setRelCanLeft, setRelCanRight);
    const onOthScroll = () => updateButtonsFor(othEl, setOthCanLeft, setOthCanRight);

    updateButtonsFor(relEl, setRelCanLeft, setRelCanRight);
    updateButtonsFor(othEl, setOthCanLeft, setOthCanRight);

    relEl?.addEventListener("scroll", onRelScroll, { passive: true });
    othEl?.addEventListener("scroll", onOthScroll, { passive: true });
    window.addEventListener("resize", onRelScroll);
    window.addEventListener("resize", onOthScroll);
    return () => {
      relEl?.removeEventListener("scroll", onRelScroll);
      othEl?.removeEventListener("scroll", onOthScroll);
      window.removeEventListener("resize", onRelScroll);
      window.removeEventListener("resize", onOthScroll);
    };
  }, [relatedProducts, otherProducts]);

  const scrollTrack = (ref, dir = 1) => {
    const el = ref.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.85);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  const contextLabel = displayIsTable ? "Masa" : displayIsRoom ? "Otaq" : "Masa/Otaq";

  return (
    <div className="basket-page">
      <div className="container">
        <h1 className="page-title">Səbətim</h1>

        {/* Kontekst məlumatı (yalnız görüntü) */}
        <div className="table-info" aria-label="context-number">
          <i className={`icon fas ${displayIsTable ? "fa-chair" : "fa-door-open"}`} aria-hidden="true"></i>
          <span className="label">{contextLabel}:</span>
          <span className="value">{displayNumber ?? "-"}</span>
        </div>

        {/* roomOrder rejimi üçün müştəri kartı */}
        {roomOrderMode && customer && (
          <div className="customer-info-card" style={{ marginBottom: 16 }}>
            <div className="row">
              <strong>Qonaq:</strong>&nbsp;
              <span>{customer.firstName} {customer.lastName}</span>
            </div>
            <div className="row">
              <strong>Telefon:</strong>&nbsp;<span>{customer.phone}</span>
            </div>
          </div>
        )}

        {basketItems.length === 0 ? (
          <div className="empty-basket">
            <i className="fas fa-shopping-basket"></i>
            <h2>Səbətiniz boşdur</h2>
            <p>Sifariş vermək üçün məhsul əlavə edin</p>
          </div>
        ) : (
          <>
            {/* 1) SİFARIŞLƏR (SƏBƏT MADDƏLƏRİ) */}
            <div className="basket-items">
              {basketItems.map((item) => (
                <div key={item.id} className="basket-item">
                  <div className="item-image">
                    <img src={item.image} alt={item.name_az} />
                  </div>

                  <div className="item-details">
                    <h3 className="item-name">{item.name_az}</h3>
                    <p className="item-description">{item.description_az}</p>
                    <div className="item-price">{item.price.toFixed(2)} AZN</div>

                    {(item.vegan || item.halal) && (
                      <div className="item-tags">
                        {item.vegan && <span className="tag vegan">Vegan</span>}
                        {item.halal && <span className="tag halal">Halal</span>}
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

            {/* 2) ƏLAQƏLİ MƏHSULLAR */}
            {relatedProducts.length > 0 && (
              <div className="suggestions-section">
                <div className="section-header">
                  <h2>Əlaqəli ərzaqlar</h2>
                </div>

                <div className="carousel">
                  <button
                    className={`scroll-btn left ${relCanLeft ? "" : "disabled"}`}
                    onClick={() => scrollTrack(relatedRef, -1)}
                    disabled={!relCanLeft}
                    aria-label="Sol"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>

                  <div className="suggestions-track" ref={relatedRef}>
                    {relatedProducts.map((p) => (
                      <div key={p.id} className="suggestion-card">
                        <div className="sugg-image">
                          <img src={p.image} alt={p.name_az} />
                          {(p.vegan || p.halal) && (
                            <div className="sugg-tags">
                              {p.vegan && <span className="tag vegan">Vegan</span>}
                              {p.halal && <span className="tag halal">Halal</span>}
                            </div>
                          )}
                        </div>
                        <div className="sugg-info">
                          <h3 className="sugg-name" title={p.name_az}>{p.name_az}</h3>
                          <div className="sugg-price">{Number(p.cost).toFixed(2)} AZN</div>
                          <button className="sugg-add" onClick={() => addFromSuggestion(p)}>
                            <i className="fas fa-plus"></i> Səbətə əlavə et
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className={`scroll-btn right ${relCanRight ? "" : "disabled"}`}
                    onClick={() => scrollTrack(relatedRef, 1)}
                    disabled={!relCanRight}
                    aria-label="Sağ"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* 3) Digər məhsullar */}
            {otherProducts.length > 0 && (
              <div className="suggestions-section alt">
                <div className="section-header">
                  <h2>Digər məhsullar</h2>
                </div>

                <div className="carousel">
                  <button
                    className={`scroll-btn left ${othCanLeft ? "" : "disabled"}`}
                    onClick={() => scrollTrack(otherRef, -1)}
                    disabled={!othCanLeft}
                    aria-label="Sol"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>

                  <div className="suggestions-track" ref={otherRef}>
                    {otherProducts.map((p) => (
                      <div key={p.id} className="suggestion-card">
                        <div className="sugg-image">
                          <img src={p.image} alt={p.name_az} />
                          {(p.vegan || p.halal) && (
                            <div className="sugg-tags">
                              {p.vegan && <span className="tag vegan">Vegan</span>}
                              {p.halal && <span className="tag halal">Halal</span>}
                            </div>
                          )}
                        </div>
                        <div className="sugg-info">
                          <h3 className="sugg-name" title={p.name_az}>{p.name_az}</h3>
                          <div className="sugg-price">{Number(p.cost).toFixed(2)} AZN</div>
                          <button className="sugg-add" onClick={() => addFromSuggestion(p)}>
                            <i className="fas fa-plus"></i> Səbətə əlavə et
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className={`scroll-btn right ${othCanRight ? "" : "disabled"}`}
                    onClick={() => scrollTrack(otherRef, 1)}
                    disabled={!othCanRight}
                    aria-label="Sağ"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* 4) QEYD + XÜLASƏ + TƏSDİQ */}
            <div className="finalize-order">
              <div className="order-summary inline">
                <h2>Sifariş Xülasəsi</h2>

                <div className="table-info-inline">
                  <i className={`fas ${displayIsTable ? "fa-chair" : "fa-door-open"}`} aria-hidden="true"></i>
                  <span>
                    {displayIsTable ? "Masa" : displayIsRoom ? "Otaq" : "Masa/Otaq"}:
                    <span className="value"> {displayNumber ?? "-"}</span>
                  </span>
                </div>

                <div className="summary-row">
                  <span>Məhsulun Ümumi Dəyəri:</span>
                  <span>{calculateTotal()} AZN</span>
                </div>

                <div className="summary-row">
                  <span>Servis haqqı:</span>
                  <span>{formatMoney(SERVICE_COST)} AZN</span>
                </div>

                <div className="summary-row total">
                  <span>Ümumi Məbləğ:</span>
                  <span>{formatMoney(subTotalNumber + SERVICE_COST)} AZN</span>
                </div>

                <div className="preparation-time">
                  <i className="fas fa-clock"></i>
                  <span>Təxmini Hazırlanma Müddəti: {calculatePreparationTime()} dəqiqə</span>
                </div>
              </div>

              <div className="order-note">
                <h3>Sifariş Qeydi</h3>
                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Sifarişinizlə bağlı qeydlər..."
                  aria-label="Order notes"
                />
              </div>

              <button className="confirm-order-btn" onClick={() => setShowConfirmation(true)}>
                Sifarişi Təsdiqlə
              </button>
            </div>
          </>
        )}
      </div>

      {showConfirmation && (
        <div className="confirmation-overlay">
          <div className="confirmation-modal">
            <button className="close-btn" onClick={() => setShowConfirmation(false)} aria-label="Close confirmation">
              <i className="fas fa-times"></i>
            </button>

            <div className="modal-content">
              <div className="modal-icon">
                <i className="fas fa-check-circle"></i>
              </div>

              <h2>Sifarişi Təsdiqlə</h2>
              <p>Sifarişinizi təsdiqləmək istədiyinizə əminsiniz?</p>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowConfirmation(false)}>
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
