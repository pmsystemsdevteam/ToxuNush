import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminHotelPage.scss";

const HOTEL_ROOM_URL = "http://172.20.5.167:8001/api/hotel-room-number/";
const ROOM_ORDERED_URL = "http://172.20.5.167:8001/api/room-ordered/";

function AdminHotelPage() {
  const [rooms, setRooms] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Yalnız dizayn — rənglər şəkildəki üsluba yaxın
  const statusConfig = {
    notOrdered: {
      key: "notOrdered",
      name: "Sifariş Yoxdur",
      color: "#CFCFCF", // boz
      textColor: "#ffffff",
    },
    ordered: {
      key: "ordered",
      name: "Sifariş Verilib",
      color: "#4CAF50", // yaşıl
      textColor: "#ffffff",
    },
    delivered: {
      key: "delivered",
      name: "Təhvil Verilib",
      color: "#3BD5FF", // mavi/cyan
      textColor: "#ffffff",
    },
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomsRes, ordersRes] = await Promise.all([
          axios.get(HOTEL_ROOM_URL, { params: { _ts: Date.now() } }),
          axios.get(ROOM_ORDERED_URL, { params: { _ts: Date.now() } }),
        ]);
        setRooms(Array.isArray(roomsRes.data) ? roomsRes.data : []);
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      } catch (e) {
        console.error("Məlumat yüklənmədi:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString("az-AZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso || "—";
    }
  };

  const getRoomOrders = (roomId) =>
    orders.filter((o) => Number(o.hotel_room) === Number(roomId));

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setSelectedOrder(null);
  };
  const handleOrderClick = (order) => setSelectedOrder(order);
  const closePopup = () => {
    setSelectedRoom(null);
    setSelectedOrder(null);
  };

  // Qoruma: yalnız delivered-ə keçid (əvvəlki istəyə uyğun)
  const updateRoomStatus = async (roomId, newStatus) => {
    if (newStatus !== "delivered") return;
    try {
      setSyncing(true);
      await axios.patch(`${HOTEL_ROOM_URL}${roomId}/`, { status: newStatus });
      setRooms((p) => p.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r)));
      if (selectedRoom?.id === roomId) {
        setSelectedRoom((s) => ({ ...s, status: newStatus }));
      }
    } catch (e) {
      console.error("Status yenilənmədi:", e?.response?.data || e);
      alert("Status dəyişmədi. Yenidən cəhd edin.");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="admin-hotel-page loading">Yüklənir...</div>;

  return (
    <div className="admin-hotel-page">
      <div className="page-bg" /> {/* yumşaq gradient fon */}

      <div className="header">
        <h1>Hotel Otaq İdarəetmə</h1>
      </div>

      {/* Rəng Kodları kartı */}
      <div className="legend-card">
        <h2>Rəng Kodları</h2>
        <div className="legend-grid">
          {Object.values(statusConfig).map((s) => (
            <div key={s.key} className="legend-row">
              <span className="legend-dot" style={{ backgroundColor: s.color }} />
              <span className="legend-label">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Otaqlar — dairəvi dizayn + 4 “stul” */}
      <div className="rooms-stage">
        {rooms.map((room) => {
          const st = room.status || "notOrdered";
          const cfg = statusConfig[st] || statusConfig.notOrdered;
          return (
            <div
              key={room.id}
              className="room-token"
              onClick={() => handleRoomClick(room)}
              title={`Otaq ${room.number} — ${cfg.name}`}
            >

              <div className="room-circle" style={{ backgroundColor: cfg.color }}>
                <span className="room-num">{room.number}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==== Popup: sənin əvvəlki məzmununla işləyəcək ==== */}
      {selectedRoom && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closePopup}>×</button>
            <h2>Otaq {selectedRoom.number}</h2>

            {/* Yalnız delivered enable — qalanları baxış üçündür */}
            <div className="status-controls">
              <h3>Statusu Dəyişdir:</h3>
              <div className="status-buttons">
                {Object.values(statusConfig).map((cfg) => {
                  const active = (selectedRoom.status || "notOrdered") === cfg.key;
                  const allowed = cfg.key === "delivered";
                  return (
                    <button
                      key={cfg.key}
                      className={`st-btn ${active ? "active" : ""}`}
                      style={{
                        borderColor: cfg.color,
                        backgroundColor: allowed ? cfg.color : "#fff",
                        color: allowed ? cfg.textColor : "#111827",
                      }}
                      onClick={() => (allowed ? updateRoomStatus(selectedRoom.id, cfg.key) : null)}
                      disabled={syncing || (!allowed || active)}
                      title={cfg.name + (allowed ? "" : " (yalnız baxış)")}
                    >
                      <span className="dot" style={{ backgroundColor: cfg.color }} />
                      {cfg.name}
                    </button>
                  );
                })}
              </div>
              {syncing && <div className="hint">Yenilənir...</div>}
            </div>

            <div className="orders-section">
              <h3>Sifarişlər</h3>
              <div className="orders-list">
                {getRoomOrders(selectedRoom.id).length ? (
                  getRoomOrders(selectedRoom.id).map((o) => (
                    <div key={o.id} className="order-item" onClick={() => handleOrderClick(o)}>
                      <div className="order-header">
                        <span className="order-id">Sifariş #{o.id}</span>
                        <span className="order-date">{formatDate(o.created_at)}</span>
                      </div>
                      <div className="order-details">
                        <div className="customer-info">
                          {o.customer && <span>Müştəri: {o.customer}</span>}
                          {o.phone && <span>Telefon: {o.phone}</span>}
                        </div>
                        <div className="order-cost">Ümumi: {o.total_cost} AZN</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-orders">Bu otaq üçün sifariş tapılmadı.</p>
                )}
              </div>
            </div>

            {selectedOrder && (
              <div className="order-details-popup">
                <h3>Sifariş #{selectedOrder.id} - Detallar</h3>
                <div className="order-info">
                  <div className="info-row"><span className="label">Müştəri:</span><span className="value">{selectedOrder.customer || "Yoxdur"}</span></div>
                  <div className="info-row"><span className="label">Telefon:</span><span className="value">{selectedOrder.phone || "Yoxdur"}</span></div>
                  <div className="info-row"><span className="label">Qeyd:</span><span className="value">{selectedOrder.note || "Yoxdur"}</span></div>
                  <div className="info-row"><span className="label">Xidmət haqqı:</span><span className="value">{selectedOrder.service_cost} AZN</span></div>
                  <div className="info-row"><span className="label">Ümumi məbləğ:</span><span className="value">{selectedOrder.total_cost} AZN</span></div>
                  <div className="info-row"><span className="label">Yaradılma:</span><span className="value">{formatDate(selectedOrder.created_at)}</span></div>
                </div>

                <h4>Məhsullar</h4>
                <div className="products-list">
                  {selectedOrder.items?.map((it) => (
                    <div key={it.id} className="product-item">
                      <div className="product-name">{it.name_az}</div>
                      <div className="product-details">
                        <span>{it.count} x {it.cost} AZN</span>
                        <span>{((Number(it.count)||0) * parseFloat(it.cost||"0")).toFixed(2)} AZN</span>
                      </div>
                      {it.description_az && <div className="product-description">{it.description_az}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminHotelPage;
