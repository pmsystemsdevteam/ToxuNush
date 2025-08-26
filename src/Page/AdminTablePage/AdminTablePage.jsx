import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminTablePage.scss";

const TABLES_URL = "https://api.albanproject.az/api/tables/";
const BASKETS_URL = "https://api.albanproject.az/api/baskets/";

function AdminTablePage() {
  const statusColors = {
    empty: "#CCCCCC",
    reserved: "#ee0d0dff",
    ordered: "#4CAF50",
    waitingFood: "#f38722ff",
    waitingWaiter: "#FFEB3B",
  };

  const statusNames = {
    empty: "Boş",
    reserved: "Rezerv Edilmiş",
    ordered: "Sifariş Verildi",
    waitingFood: "Yemək Gözləyir",
    waitingWaiter: "Ofisiant Gözləyir",
  };

  const statusFromServer = (s) => {
    if (!s) return "empty";
    if (s === "waitingWaite") return "waitingWaiter";
    if (s === "occupied" || s === "served") return "ordered";
    const allowed = ["empty", "reserved", "ordered", "waitingFood", "waitingWaiter"];
    return allowed.includes(s) ? s : "empty";
  };

  const statusToServer = (s) => {
    if (s === "waitingWaiter") return "waitingWaite";
    if (s === "ordered") return "ordered";
    if (s === "empty") return "empty";
    if (s === "reserved") return "reserved";
    if (s === "waitingFood") return "waitingFood";
    return "empty";
  };

  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "info" });
  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [reserveAt, setReserveAt] = useState(""); // HH:MM

  // NEW: bütün basketlər (popup üçün istifadə ediləcək)
  const [allBaskets, setAllBaskets] = useState([]);
  const [showOrdersPopup, setShowOrdersPopup] = useState(false);
  const [ordersForTable, setOrdersForTable] = useState([]);

  useEffect(() => {
    if (selectedTableId != null) {
      const t = tables.find((x) => x.id === selectedTableId) || null;
      setSelectedTable(t);
      if (t?.status === "reserved" && t?.orderTime) {
        const mm = /^([0-2]\d:[0-5]\d)$/.exec(t.orderTime);
        setReserveAt(mm ? mm[1] : "");
      } else {
        setReserveAt("");
      }
    } else {
      setSelectedTable(null);
      setReserveAt("");
    }
  }, [selectedTableId, tables]);

  const safeNumber = (n) => {
    const v = typeof n === "string" ? parseFloat(n) : Number(n);
    return Number.isFinite(v) ? v : 0;
  };

  const to2 = (n) => Number(n || 0).toFixed(2);

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("az-Latn-AZ", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return null;
    }
  };

  const formatDateTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("az-Latn-AZ", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso ?? "";
    }
  };

  const parseReservedTimeFromNote = (note) => {
    if (!note) return null;
    const m = /Rezerv vaxtı:\s*([0-2]\d:[0-5]\d)/i.exec(note);
    return m ? m[1] : null;
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      const [tRes, bRes] = await Promise.all([axios.get(TABLES_URL), axios.get(BASKETS_URL)]);
      const tablesApi = Array.isArray(tRes.data) ? tRes.data : [];
      const basketsApi = Array.isArray(bRes.data) ? bRes.data : [];

      // NEW: saxla
      setAllBaskets(basketsApi);

      const latestByTableId = new Map();
      for (const b of basketsApi) {
        const tid = b?.table?.id;
        if (!tid) continue;
        const exist = latestByTableId.get(tid);
        if (!exist || new Date(b.created_at) > new Date(exist.created_at)) {
          latestByTableId.set(tid, b);
        }
      }

      const merged = tablesApi
        .map((t) => {
          const latest = latestByTableId.get(t.id);
          const reservedNoteTime = latest ? parseReservedTimeFromNote(latest.note) : null;
          return {
            id: t.table_num,
            number: t.table_num,
            status: statusFromServer(t.status),
            orderPrice: latest ? safeNumber(latest.total_cost) : 0,
            orderTime: reservedNoteTime ?? (latest ? formatTime(latest.created_at) : null),
            backendTableId: t.id,
          };
        })
        .sort((a, b) => a.number - b.number);

      setTables(merged);
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

  const handleTableClick = (tableId) => setSelectedTableId(tableId);
  const closePopup = () => {
    setSelectedTableId(null);
    setSelectedTable(null);
    setReserveAt("");
  };

  const showNote = (message, type = "info") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "info" }), 3000);
  };

  const patchTableStatus = (backendTableId, serverStatus) => {
    return axios.patch(
      `${TABLES_URL}${backendTableId}/`,
      { status: serverStatus },
      { headers: { "Content-Type": "application/json" } }
    );
  };

  const postBasket = (tableWithNewStatus, reservedTimeText = "") => {
    const extra =
      tableWithNewStatus.status === "reserved" && reservedTimeText
        ? ` | Rezerv vaxtı: ${reservedTimeText}`
        : "";
    const payload = {
      table_id: tableWithNewStatus.backendTableId,
      note: `Status: ${statusNames[tableWithNewStatus.status] || tableWithNewStatus.status}${extra}`,
      service_cost: "2.50",
      items: [],
    };
    return axios.post(BASKETS_URL, payload, { headers: { "Content-Type": "application/json" } });
  };

  const changeTableStatus = async (tableId, newStatusUI) => {
    const prev = tables.find((t) => t.id === tableId);
    if (!prev) return;

    if (newStatusUI === "reserved" && !reserveAt) {
      showNote("Zəhmət olmasa rezerv vaxtını seçin (HH:MM).", "error");
      return;
    }

    const serverStatus = statusToServer(newStatusUI);
    if (!prev.backendTableId) {
      showNote("Bu masa üçün backend table_id tapılmadı.", "error");
      return;
    }

    let nextOrderPrice = prev.orderPrice ?? 0;
    let nextOrderTime = prev.orderTime ?? null;

    if (newStatusUI === "reserved") {
      nextOrderPrice = 0;
      nextOrderTime = reserveAt;
    } else if (newStatusUI === "empty") {
      nextOrderPrice = 0;
      nextOrderTime = null;
    } else if (
      (newStatusUI === "ordered" || newStatusUI === "waitingWaiter") &&
      prev.status !== newStatusUI
    ) {
      const now = new Date().toLocaleTimeString("az-Latn-AZ", { hour: "2-digit", minute: "2-digit" });
      nextOrderTime = now;
    }

    // Optimistic UI
    setTables((p) =>
      p.map((t) =>
        t.id === tableId
          ? { ...t, status: newStatusUI, orderPrice: nextOrderPrice, orderTime: nextOrderTime }
          : t
      )
    );

    setSyncingId(tableId);
    try {
      await patchTableStatus(prev.backendTableId, serverStatus);
      await postBasket(
        { ...prev, status: newStatusUI, orderPrice: nextOrderPrice, orderTime: nextOrderTime },
        newStatusUI === "reserved" ? reserveAt : ""
      );
      await loadAll();
      showNote("Status dəyişdirildi və serverə yazıldı.", "success");
    } catch (e) {
      console.error(e);
      setTables((p) =>
        p.map((t) =>
          t.id === tableId
            ? { ...t, status: prev.status, orderPrice: prev.orderPrice, orderTime: prev.orderTime }
            : t
        )
      );
      const msg =
        e?.response?.data ? `Xəta: ${JSON.stringify(e.response.data)}` : e?.message || "Naməlum xəta.";
      showNote(`Dəyişiklik alınmadı. ${msg}`, "error");
    } finally {
      setSyncingId(null);
    }
  };

  const updateOrderPrice = (tableId, price) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, orderPrice: safeNumber(price) } : t))
    );
  };

  // NEW: “Sifarişi gör” düyməsi üçün
  const openOrdersPopup = (tbl) => {
    if (!tbl?.backendTableId) return;
    // Ən yenisi birinci
    const rows = allBaskets
      .filter((b) => b?.table?.id === tbl.backendTableId)
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

      <div className="tables-container">
        {tables.map((table) => (
          <div key={table.id} className="table-wrapper" onClick={() => handleTableClick(table.id)}>
            <div className="table" style={{ backgroundColor: statusColors[table.status] || "#ccc" }}>
              <div className="table-number">{table.number}</div>
              <div className="chair chair-top"></div>
              <div className="chair chair-right"></div>
              <div className="chair chair-bottom"></div>
              <div className="chair chair-left"></div>
            </div>
          </div>
        ))}

        {!loading && tables.length === 0 && (
          <div className="empty-state">Masa tapılmadı. (GET /api/tables/)</div>
        )}
      </div>

      {selectedTable && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="table-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closePopup}>×</button>

            <h2>Masa {selectedTable.number}</h2>

            <div className="status-info">
              <div
                className="status-color"
                style={{ backgroundColor: statusColors[selectedTable.status] || "#ccc" }}
              ></div>
              <span>Status: {statusNames[selectedTable.status]}</span>
            </div>

            {(selectedTable.orderTime || selectedTable.orderPrice > 0) && (
              <div className="order-info">
                {selectedTable.orderTime && (
                  <p>
                    {selectedTable.status === "reserved" ? "Rezerv vaxtı: " : "Sifariş vaxtı: "}
                    <strong>{selectedTable.orderTime}</strong>
                  </p>
                )}
                {selectedTable.status !== "reserved" && (
                  <p>
                    Sifariş Qiyməti: <strong>{Number(selectedTable.orderPrice || 0).toFixed(2)}₼</strong>
                  </p>
                )}
              </div>
            )}

            {/* REZERV VAxTI GİRİŞİ */}
            <div className="reserve-control">
              <label>Rezerv vaxtı (HH:MM):</label>
              <input
                type="time"
                value={reserveAt}
                onChange={(e) => setReserveAt(e.target.value)}
                disabled={syncingId === selectedTable.id}
              />
              <small className="hint">
                “Rezerv” düyməsinə basmazdan öncə vaxtı seçin (məs: 19:00).
              </small>
            </div>

            <div className="status-controls">
              <h3>Statusu Dəyişdir </h3>
              <div className="status-buttons">
                <button
                  onClick={() => changeTableStatus(selectedTable.id, "empty")}
                  className={selectedTable.status === "empty" ? "active" : ""}
                  disabled={syncingId === selectedTable.id}
                >
                  Boş
                </button>
                <button
                  onClick={() => changeTableStatus(selectedTable.id, "reserved")}
                  className={selectedTable.status === "reserved" ? "active" : ""}
                  disabled={syncingId === selectedTable.id}
                >
                  Rezerve
                </button>
                <button
                  onClick={() => changeTableStatus(selectedTable.id, "ordered")}
                  className={selectedTable.status === "ordered" ? "active" : ""}
                  disabled={syncingId === selectedTable.id}
                >
                  Sifariş Verildi
                </button>
                <button
                  onClick={() => changeTableStatus(selectedTable.id, "waitingFood")}
                  className={selectedTable.status === "waitingFood" ? "active" : ""}
                  disabled={syncingId === selectedTable.id}
                >
                  Yəmək Gözləyir
                </button>
                <button
                  onClick={() => changeTableStatus(selectedTable.id, "waitingWaiter")}
                  className={selectedTable.status === "waitingWaiter" ? "active" : ""}
                  disabled={syncingId === selectedTable.id}
                >
                  Ofisiant Gözləyir
                </button>
              </div>
              {syncingId === selectedTable.id && <p className="hint">Yazılır...</p>}
            </div>

            {/* NEW: Sifarişləri gör düyməsi */}
            <button
              className="submit-btn"
              onClick={() => openOrdersPopup(selectedTable)}
              disabled={!selectedTable?.backendTableId}
            >
              Sifarişi gör
            </button>
          </div>
        </div>
      )}

      {/* NEW: Sifarişlər popupu */}
      {showOrdersPopup && (
        <div
          className="popup-overlay"
          style={{ zIndex: 1002 }}
          onClick={() => setShowOrdersPopup(false)}
        >
          <div className="table-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowOrdersPopup(false)}>×</button>
            <h2>Masa {selectedTable?.number} — Sifarişlər</h2>

            {ordersForTable.length === 0 ? (
              <div className="empty-state">Bu masada sifariş tapılmadı.</div>
            ) : (
              <div className="orders-list">
                {ordersForTable.map((b) => (
                  <div className="order-card" key={b.id}>
                    <div className="order-header">
                      <span>Basket #{b.id}</span>
                      <span>{formatDateTime(b.created_at)}</span>
                    </div>

                    <div className="order-line">
                      <strong>Qeyd:</strong> {b.note || "—"}
                    </div>

                    <div className="order-meta">
                      <span>Servis: <strong>{to2(b.service_cost)}₼</strong></span>
                      <span>Cəmi: <strong>{to2(b.total_cost)}₼</strong></span>
                      <span>Vaxt: <strong>{b.total_time || 0} dəq</strong></span>
                    </div>

                    {Array.isArray(b.items) && b.items.length > 0 && (
                      <ul className="order-items">
                        {b.items.map((it) => (
                          <li key={it.id} className="order-item-row">
                            <span>
                              {it.count} × {it.name_az}
                            </span>
                            <span>{to2(Number(it.cost) * Number(it.count))}₼</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="legend">
        <h2>Rəng Kodları</h2>
        <div className="legend-items">
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: statusColors.empty }}></div>
            <span>Boş Masa</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: statusColors.reserved }}></div>
            <span>Rezerve Edilmiş</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: statusColors.ordered }}></div>
            <span>Sifariş Verildi</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: statusColors.waitingFood }}></div>
            <span>Yemək Gözləyir</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: statusColors.waitingWaiter }}></div>
            <span>Ofisiant Gözləyir</span>
          </div>
        </div>
      </div>

      {notification.show && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}
    </div>
  );
}

export default AdminTablePage;
