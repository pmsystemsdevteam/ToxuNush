import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import "./AdminTablePage.scss";

const TABLES_URL = "http://172.20.5.167:8001/api/tables/";
const BASKETS_URL = "http://172.20.5.167:8001/api/baskets/";
const RESERVATIONS_URL = "http://172.20.5.167:8001/api/reservations/";
const SOON_THRESHOLD_MIN = 5;

/* ================= Utils ================= */
const pad2 = (n) => String(n).padStart(2, "0");
const toAzDate = (isoOrYmd) => {
  try {
    const d = isoOrYmd?.includes?.("T")
      ? new Date(isoOrYmd)
      : new Date(`${isoOrYmd}T00:00:00`);
    return d.toLocaleDateString("az-Latn-AZ");
  } catch {
    return isoOrYmd || "—";
  }
};
const toAzDateTime = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString("az-Latn-AZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso || "—";
  }
};
const todayYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const parseTimeRange = (range) => {
  const s = String(range || "");
  const parts = s.split("-");
  if (parts.length !== 2) return null;
  const [sh, sm] = parts[0].split(":").map((x) => parseInt(x, 10));
  const [eh, em] = parts[1].split(":").map((x) => parseInt(x, 10));
  if ([sh, sm, eh, em].some((v) => Number.isNaN(v))) return null;
  return { startMin: sh * 60 + sm, endMin: eh * 60 + em };
};
const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};
const hhmm = (hhmmss) => {
  if (!hhmmss) return "";
  const parts = String(hhmmss).split(":");
  if (parts.length >= 2)
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  return hhmmss;
};
const toYMDfromISO = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/* ================= Status maps (server <-> UI) ================= */
// QƏBUL OLUNAN statusların dəstəsi (backend enum-u ilə uyğundur)
const ALLOWED_STATUSES = [
  "empty",
  "reserved",
  "waitingFood",
  "waitingWaiter",
  "waitingBill",
  "sendOrder",
  "sendKitchen",
  "makeFood",
  "deliveredFood",
];

// UI-də görünmə ardıcıllığı
const STATUS_ORDER = [
  "empty",
  "waitingFood",
  "waitingWaiter",
  "sendOrder",
  "sendKitchen",
  "makeFood",
  "deliveredFood",
  "reserved",
];

const normalizeStatus = (raw) => {
  if (!raw) return "empty";
  if (raw === "waitingWaite") return "waitingWaiter";
  if (raw === "ordered") return "sendOrder";
  return ALLOWED_STATUSES.includes(raw) ? raw : "empty";
};

const statusToServer = (ui) => {
  const map = {
    empty: "empty",
    reserved: "reserved",
    waitingFood: "waitingFood",
    waitingWaiter: "waitingWaiter",
    waitingBill: "waitingBill",
    sendOrder: "sendOrder",
    sendKitchen: "sendKitchen",
    makeFood: "makeFood",
    deliveredFood: "deliveredFood",
  };
  return map[ui] || "empty";
};

const statusNames = {
  empty: "Boş",
  reserved: "Rezerv",
  waitingFood: "Yemək gözləyir",
  waitingWaiter: "Ofisiant gözləyir",
  waitingBill: "Hesab gözləyir",
  sendOrder: "Sifariş göndərildi",
  sendKitchen: "Yemək mətbəxə göndərildi",
  makeFood: "Yemək hazırlanır",
  deliveredFood: "Yemək təhvil verildi",
};

const statusColors = {
  empty: "#CCCCCC",
  reserved: "#ee0d0dff",
  waitingFood: "#f38722ff",
  waitingWaiter: "#FFEB3B",
  waitingBill: "#3bd5ff",
  sendOrder: "#4CAF50",
  sendKitchen: "#2196F3",
  makeFood: "#9C27B0",
  deliveredFood: "#8BC34A",
};

// ✅ Yalnız bu statuslar manual dəyişdirilə bilər və bu ardıcıllıqla göstərilir
const ADMIN_MUTABLE = ["empty", "sendKitchen", "deliveredFood"];

function AdminTablePage() {
  const [tables, setTables] = useState([]);
  const [allBaskets, setAllBaskets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const [selectedId, setSelectedId] = useState(null);
  const selectedTable = useMemo(
    () => tables.find((t) => t.id === selectedId) || null,
    [tables, selectedId]
  );

  // Rezerv formu
  const [resvDate, setResvDate] = useState(todayYMD());
  const [resvStart, setResvStart] = useState("");
  const [resvEnd, setResvEnd] = useState("");
  const [resvCustomer, setResvCustomer] = useState("");
  const [resvPhone, setResvPhone] = useState("");

  // canlı vaxt indikasiya (15s)
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  const [syncingId, setSyncingId] = useState(null);

  const [showOrdersPopup, setShowOrdersPopup] = useState(false);
  const [ordersForTable, setOrdersForTable] = useState([]);

  const autoOpsRef = useRef({});

  const showNote = (message, type = "info") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "info" }),
      2800
    );
  };

  const buildTablesModel = (tablesApi, basketsApi) => {
    const latestBasketByTable = new Map();
    for (const b of basketsApi || []) {
      const tid = b?.table?.id;
      if (!tid) continue;
      const exist = latestBasketByTable.get(tid);
      if (!exist || new Date(b.created_at) > new Date(exist.created_at)) {
        latestBasketByTable.set(tid, b);
      }
    }

    const today = todayYMD();

    return (tablesApi || [])
      .map((t) => {
        const status = normalizeStatus(t.status);
        const res = Array.isArray(t.reservations) ? t.reservations.slice() : [];

        const futureRes = res
          .filter((r) => r.date >= today)
          .sort((a, b) =>
            a.date === b.date
              ? (parseTimeRange(a.reserved_time)?.startMin || 0) -
                (parseTimeRange(b.reserved_time)?.startMin || 0)
              : a.date.localeCompare(b.date)
          );
        const nextLabel = futureRes[0]
          ? `${
              futureRes[0].date === today ? "Bu gün" : toAzDate(futureRes[0].date)
            } ${futureRes[0].reserved_time}`
          : "";

        const lastB = latestBasketByTable.get(t.id);
        const lastTotal = lastB ? Number(lastB.total_cost || 0) : 0;

        return {
          id: t.id,
          number: t.table_num,
          status,
          color: statusColors[status] || "#ccc",
          chairNumber: t.chair_number ?? null,
          created_at: t.created_at,
          reservations: res,
          lastBasketTotal: lastTotal,
          nextLabel,
        };
      })
      .sort((a, b) => a.number - b.number);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      const [tRes, bRes] = await Promise.all([
        axios.get(TABLES_URL, { params: { _ts: Date.now() } }),
        axios.get(BASKETS_URL, { params: { _ts: Date.now() } }),
      ]);
      const tablesApi = Array.isArray(tRes.data) ? tRes.data : [];
      const basketsApi = Array.isArray(bRes.data) ? bRes.data : [];
      setAllBaskets(basketsApi);
      setTables(buildTablesModel(tablesApi, basketsApi));
    } catch (e) {
      console.error(e);
      showNote("Məlumatlar çəkilərkən xəta baş verdi.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openTable = (backendId) => {
    setSelectedId(backendId);
    setResvDate(todayYMD());
    setResvStart("");
    setResvEnd("");
    setResvCustomer("");
    setResvPhone("");
  };

  const closePopup = () => {
    setSelectedId(null);
  };

  /* ====== STATUS SYNC HELPERS (YALNIZ PUT) ====== */
  const getTableSnapshot = (tableId) => {
    const t = tables.find((x) => x.id === tableId);
    if (!t) throw new Error("Masa tapılmadı");
    return t;
  };

  const putTableStatus = (tableSnap, serverStatus) =>
    axios.put(
      `${TABLES_URL}${tableSnap.id}/`,
      {
        table_num: tableSnap.number,
        chair_number: tableSnap.chairNumber ?? 4,
        status: serverStatus,
      },
      { headers: { "Content-Type": "application/json" } }
    );

  const setTableStatusOnServer = async (tableId, nextStatusUI) => {
    const serverStatus = statusToServer(nextStatusUI);
    const snap = getTableSnapshot(tableId);
    await putTableStatus(snap, serverStatus);
  };

  /* ====== BASKET NOTE: CREATE əvəzinə EDIT ====== */
  const getLatestBasketIdForTable = (tableId) => {
    const rows = (allBaskets || [])
      .filter((b) => b?.table?.id === tableId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return rows[0]?.id ?? null;
  };

  const patchBasketNote = (basketId, note) =>
    axios.patch(
      `${BASKETS_URL}${basketId}/`,
      { note },
      { headers: { "Content-Type": "application/json" } }
    );

  const updateLatestBasketNoteForStatus = async (
    tableId,
    statusUI,
    reservedTimeText = ""
  ) => {
    const basketId = getLatestBasketIdForTable(tableId);
    if (!basketId) return;
    const extra =
      statusUI === "reserved" && reservedTimeText
        ? ` | Rezerv vaxtı: ${reservedTimeText}`
        : "";
    const note = `Status: ${statusNames[statusUI] || statusUI}${extra}`;
    await patchBasketNote(basketId, note);
  };

  const validateReservationForm = () => {
    if (!resvDate) return "Tarix seçin.";
    if (!resvStart) return "Başlama saatını seçin.";
    if (!resvEnd) return "Bitmə saatını seçin.";
    if (!resvCustomer) return "Müştəri adını yazın.";
    if (!resvPhone) return "Telefon nömrəsini yazın.";
    const rng = parseTimeRange(`${resvStart}-${resvEnd}`);
    if (!rng || rng.startMin >= rng.endMin) {
      return "Saat intervalı səhvdir. (məs: 12:00-16:00)";
    }
    return null;
  };

  const createReservation = async (table) => {
    const err = validateReservationForm();
    if (err) {
      showNote(err, "error");
      throw new Error(err);
    }
    const reserved_time = `${resvStart}-${resvEnd}`;
    const payload = {
      table: table.id,
      chair_number: table.chairNumber ?? 4,
      date: resvDate,
      reserved_time,
      phone: resvPhone,
      customer: resvCustomer,
    };
    await axios.post(RESERVATIONS_URL, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return reserved_time;
  };

  // ✅ Yalnız icazəli 3 statusu dəyiş
  const changeTableStatus = async (tableBackendId, newStatusUI) => {
    if (!ADMIN_MUTABLE.includes(newStatusUI)) {
      showNote("Bu statusu əl ilə dəyişmək icazəli deyil.", "error");
      return;
    }
    const prev = tables.find((t) => t.id === tableBackendId);
    if (!prev) return;
    setSyncingId(tableBackendId);

    try {
      // Optimistic UI
      setTables((p) =>
        p.map((t) =>
          t.id === tableBackendId
            ? {
                ...t,
                status: newStatusUI,
                color: statusColors[newStatusUI] || "#ccc",
              }
            : t
        )
      );

      await setTableStatusOnServer(tableBackendId, newStatusUI);
      await updateLatestBasketNoteForStatus(tableBackendId, newStatusUI, "");

      await loadAll();
      showNote("Əməliyyat yerinə yetirildi.", "success");
    } catch (e) {
      console.error(e);
      showNote(e?.message || "Xəta baş verdi.", "error");
      // revert
      setTables((p) =>
        p.map((t) =>
          t.id === tableBackendId
            ? { ...t, status: prev.status, color: prev.color }
            : t
        )
      );
    } finally {
      setSyncingId(null);
    }
  };

  const pickClosestReservationForBasket = (basket) => {
    const resList = basket?.table?.reservations || [];
    if (resList.length === 0) return null;
    const anchorDay = toYMDfromISO(basket.created_at);
    const future = resList
      .filter((r) => r.date >= anchorDay)
      .sort((a, b) => a.date.localeCompare(b.date));
    return future[0] || null;
  };

  const computeRuntimeFlags = (t) => {
    const today = todayYMD();
    const nowMin = nowMinutes();

    const todays = (t.reservations || []).filter((r) => r.date === today);
    let activeNow = false;
    let startingSoon = false;
    let dynamicLabel = t.nextLabel || "";

    if (todays.length > 0) {
      const sorted = todays.sort(
        (a, b) =>
          (parseTimeRange(a.reserved_time)?.startMin || 0) -
          (parseTimeRange(b.reserved_time)?.startMin || 0)
      );
      for (const r of sorted) {
        const rng = parseTimeRange(r.reserved_time);
        if (!rng) continue;
        if (nowMin >= rng.startMin && nowMin < rng.endMin) {
          activeNow = true;
          dynamicLabel = `Bu gün ${r.reserved_time}`;
          break;
        }
        const delta = rng.startMin - nowMin;
        if (delta > 0 && delta <= SOON_THRESHOLD_MIN) {
          startingSoon = true;
          dynamicLabel = `Bu gün ${r.reserved_time}`;
        }
      }
    }
    return { activeNow, startingSoon, dynamicLabel };
  };

  // Auto sync: rezerv başlayanda → reserved; bitəndə → empty (digərlərinə toxunma)
  useEffect(() => {
    if (!tables || tables.length === 0) return;
    const today = todayYMD();
    const nowMin = nowMinutes();

    tables.forEach((t) => {
      const todays = (t.reservations || []).filter((r) => r.date === today);
      let activeNow = false;
      for (const r of todays) {
        const rng = parseTimeRange(r.reserved_time);
        if (!rng) continue;
        if (nowMin >= rng.startMin && nowMin < rng.endMin) {
          activeNow = true;
          break;
        }
      }

      if (activeNow) {
        if (t.status === "empty") {
          safeAutoSetStatus(t.id, "reserved");
        }
      } else {
        if (t.status === "reserved") {
          safeAutoSetStatus(t.id, "empty");
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowTick, tables]);

  const safeAutoSetStatus = async (tableId, nextStatus) => {
    const key = String(tableId);
    const now = Date.now();
    const guard = autoOpsRef.current[key] || { lastStatus: null, ts: 0 };
    if (guard.lastStatus === nextStatus && now - guard.ts < 60000) {
      return;
    }
    autoOpsRef.current[key] = { lastStatus: nextStatus, ts: now };

    setTables((p) =>
      p.map((t) =>
        t.id === tableId
          ? { ...t, status: nextStatus, color: statusColors[nextStatus] || t.color }
          : t
      )
    );

    try {
      await setTableStatusOnServer(tableId, nextStatus);
    } catch (err) {
      console.warn("Auto status PUT failed:", err?.message || err);
    }
  };

  const openOrdersPopup = (tbl) => {
    const rows = allBaskets
      .filter((b) => b?.table?.id === tbl.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setOrdersForTable(rows);
    setShowOrdersPopup(true);
  };

  return (
    <div className="admin-table-page">
      <div className="header-row">
        <h1>Masaların idarə edilməsi</h1>
        <div className="header-actions">
          <button onClick={loadAll} disabled={loading}>
            {loading ? "Yenilənir..." : "Yenilə"}
          </button>
        </div>
      </div>

      <div className="legend">
        <h2>Rəng Kodları</h2>
        <div className="legend-items">
          {STATUS_ORDER.map((key) => (
            <Legend key={key} color={statusColors[key]} label={statusNames[key]} />
          ))}
        </div>
      </div>

      <div className="tables-container">
        {tables.map((t) => {
          const _tick = nowTick; // rerender üçün
          const { activeNow, startingSoon } = computeRuntimeFlags(t);
          const bgColor = activeNow ? statusColors.reserved : t.color;

          return (
            <div
              key={t.id}
              className="table-wrapper"
              onClick={() => openTable(t.id)}
            >
              <div
                className={`table ${activeNow ? "active-now" : startingSoon ? "starting-soon" : ""}`}
                style={{ backgroundColor: bgColor }}
              >
                <div className="table-number">{t.number}</div>

                <div className="chair chair-top"></div>
                <div className="chair chair-right"></div>
                <div className="chair chair-bottom"></div>
                <div className="chair chair-left"></div>
              </div>
            </div>
          );
        })}

        {!loading && tables.length === 0 && (
          <div className="empty-state">Masa tapılmadı. (GET /api/tables/)</div>
        )}
      </div>

      {selectedTable && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="table-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closePopup}>
              ×
            </button>

            <h2 className="popup-title">Masa {selectedTable.number}</h2>

            <div className="popup-body">
              <div className="status-info">
                <div
                  className="status-color"
                  style={{
                    backgroundColor: statusColors[selectedTable.status] || "#ccc",
                  }}
                />
                <span>Status: {statusNames[selectedTable.status]}</span>
              </div>

              <div className="full-info">
                <div className="info-row">
                  <span className="info-label">Stul sayı:</span>
                  <span className="info-value">
                    {selectedTable.chairNumber ?? "—"}
                  </span>
                </div>

                {selectedTable.status !== "empty" && (
                  <>
                    <div className="info-row">
                      <span className="info-label">Yaradılma:</span>
                      <span className="info-value">
                        {toAzDateTime(selectedTable.created_at)}
                      </span>
                    </div>
                    {selectedTable.lastBasketTotal > 0 && (
                      <div className="info-row">
                        <span className="info-label">Son sifariş cəmi:</span>
                        <span className="info-value">
                          {selectedTable.lastBasketTotal.toFixed(2)}₼
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Rezervlər siyahısı */}
              <div className="reservations-box">
                <div className="box-head">Rezervlər (bugün və sonrası)</div>
                <div className="resv-list">
                  {selectedTable.reservations
                    .filter((r) => r.date >= todayYMD())
                    .sort((a, b) =>
                      a.date === b.date
                        ? (parseTimeRange(a.reserved_time)?.startMin || 0) -
                          (parseTimeRange(b.reserved_time)?.startMin || 0)
                        : a.date.localeCompare(b.date)
                    )
                    .map((r) => (
                      <div key={r.id} className="resv-pill">
                        <span className="date">{toAzDate(r.date)}</span>
                        <span className="time">{r.reserved_time}</span>
                        <span className="cust">
                          — {r.phone}
                          {r.customer ? `, ${r.customer}` : ""}
                        </span>
                      </div>
                    ))}
                  {selectedTable.reservations.filter(
                    (r) => r.date >= todayYMD()
                  ).length === 0 && (
                    <div className="resv-empty">Rezerv yoxdur.</div>
                  )}
                </div>
              </div>

              {/* REZERV FORMU (olduğu kimi qalır) */}
              <div className="reservation-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tarix</label>
                    <input
                      type="date"
                      value={resvDate}
                      onChange={(e) => setResvDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Başlama saatı</label>
                    <input
                      type="time"
                      value={resvStart}
                      onChange={(e) => setResvStart(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Bitmə saatı</label>
                    <input
                      type="time"
                      value={resvEnd}
                      onChange={(e) => setResvEnd(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Müştəri adı</label>
                    <input
                      type="text"
                      placeholder="Ad Soyad"
                      value={resvCustomer}
                      onChange={(e) => setResvCustomer(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Telefon</label>
                    <input
                      type="tel"
                      placeholder="+994..."
                      value={resvPhone}
                      onChange={(e) => setResvPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    className="btn secondary"
                    onClick={async () => {
                      try {
                        setSyncingId(selectedTable.id);
                        const reservedTime = await createReservation(selectedTable);
                        await loadAll();
                        showNote(`Rezerv yaradıldı (${reservedTime}).`, "success");
                      } catch (e) {
                        /* error artıq bildirilib */
                      } finally {
                        setSyncingId(null);
                      }
                    }}
                    disabled={syncingId === selectedTable.id}
                  >
                    Rezerv et
                  </button>
                </div>
              </div>

              {/* ✅ Status düymələri — yalnız 3 icazəli status və düzgün ardıcıllıq */}
              <div className="status-controls">
                <h3>Statusu Dəyişdir</h3>
                <div className="status-buttons">
                  {ADMIN_MUTABLE.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeTableStatus(selectedTable.id, s)}
                      className={selectedTable.status === s ? "active" : ""}
                      disabled={syncingId === selectedTable.id}
                    >
                      {statusNames[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="popup-footer">
              <button
                className="submit-btn"
                onClick={() => openOrdersPopup(selectedTable)}
                disabled={!selectedTable?.id}
              >
                Sifarişi gör
              </button>
            </div>
          </div>
        </div>
      )}

      {showOrdersPopup && (
        <div
          className="popup-overlay"
          style={{ zIndex: 1002 }}
          onClick={() => setShowOrdersPopup(false)}
        >
          <div className="table-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowOrdersPopup(false)}>
              ×
            </button>
            <h2>Masa {selectedTable?.number} — Sifarişlər</h2>

            {ordersForTable.length === 0 ? (
              <div className="empty-state">Bu masada sifariş tapılmadı.</div>
            ) : (
              <div className="orders-list">
                {ordersForTable.map((b) => {
                  const resv = pickClosestReservationForBasket(b);
                  const stName =
                    statusNames[normalizeStatus(b?.table?.status)] || "—";
                  return (
                    <div className="order-card" key={b.id}>
                      <div className="order-header">
                        <span>Basket #{b.id}</span>
                        <span>{toAzDateTime(b.created_at)}</span>
                      </div>

                      <div className="order-meta alt">
                        <span>
                          <strong>Status:</strong> {stName}
                        </span>
                        <span>
                          <strong>Gün:</strong> {resv ? toAzDate(resv.date) : "—"}
                        </span>
                        <span>
                          <strong>Saat:</strong> {resv?.reserved_time || "—"}
                        </span>
                        <span>
                          <strong>Müştəri:</strong> {resv?.customer || "—"}
                        </span>
                        <span>
                          <strong>Nömrə:</strong> {resv?.phone || "—"}
                        </span>
                      </div>

                      {Array.isArray(b.items) && b.items.length > 0 && (
                        <ul className="order-items">
                          {b.items.map((it) => (
                            <li key={it.id} className="order-item-row">
                              <span>
                                {it.count} × {it.name_az}
                              </span>
                              <span>
                                {(Number(it.cost) * Number(it.count)).toFixed(2)}₼
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="legend-item">
      <div className="color-box" style={{ backgroundColor: color }}></div>
      <span>{label}</span>
    </div>
  );
}

export default AdminTablePage;
