import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import "./AdminRoomPage.scss";

const ROOMS_URL = "http://172.20.5.167:8001/api/rooms/";
const ROOM_RESERVATIONS_URL = "http://172.20.5.167:8001/api/room-reservations/";
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

/* ================= Status maps ================= */
const normalizeStatus = (raw) => {
  if (!raw) return "empty";
  // köhnə adlardan gələnləri yeni adlara map (compat)
  if (raw === "occupied" || raw === "served") return "ordered";
  if (raw === "waitingWaite" || raw === "waitingWaiter" || raw === "waitingFood")
    return "waitingService";

  const allowed = ["empty", "reserved", "ordered", "waitingService", "waitingBill"];
  return allowed.includes(raw) ? raw : "empty";
};

const statusToServer = (ui) => {
  const map = {
    empty: "empty",
    reserved: "reserved",
    ordered: "ordered",
    waitingService: "waitingService",
    waitingBill: "waitingBill",
  };
  return map[ui] || "empty";
};

const statusNames = {
  empty: "Boş",
  reserved: "Rezerv",
  ordered: "Sifariş",
  waitingService: "Xidmət gözləyir",
  waitingBill: "Hesab gözləyir",
};

const statusColors = {
  empty: "#CCCCCC",        // boz
  reserved: "#ee0d0dff",   // qırmızı
  ordered: "#4CAF50",      // yaşıl
  waitingService: "#f59e0b", // narıncı
  waitingBill: "#3bd5ff",  // mavi
};

function AdminRoomPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const [selectedId, setSelectedId] = useState(null);
  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedId) || null,
    [rooms, selectedId]
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

  // Auto PATCH spam qoruyucu
  const autoOpsRef = useRef({}); // { [roomId]: { lastStatus: 'reserved'|'empty', ts: number } }

  const showNote = (message, type = "info") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "info" }),
      2800
    );
  };

  const getErrText = (err) => {
    if (err?.response?.data) {
      try {
        return JSON.stringify(err.response.data);
      } catch {
        return String(err.response.data);
      }
    }
    return err?.message || "Naməlum xəta";
  };

  /* ========= Model builder ========= */
  const buildRoomsModel = (roomsApi) => {
    const today = todayYMD();
    return (roomsApi || [])
      .map((r) => {
        const status = normalizeStatus(r.room_status);
        const res = Array.isArray(r.reservations) ? r.reservations.slice() : [];
        const futureRes = res
          .filter((x) => x.date >= today)
          .sort((a, b) =>
            a.date === b.date
              ? (parseTimeRange(a.reserved_time)?.startMin || 0) -
                (parseTimeRange(b.reserved_time)?.startMin || 0)
              : a.date.localeCompare(b.date)
          );
        const nextLabel = futureRes[0]
          ? `${futureRes[0].date === today ? "Bu gün" : toAzDate(futureRes[0].date)} ${
              futureRes[0].reserved_time
            }`
          : "";
        return {
          id: r.id,
          number: r.room_num,
          status,
          color: statusColors[status] || "#ccc",
          chairNumber: r.room_chair_number ?? null,
          created_at: r.created_at,
          reservations: res,
          nextLabel,
        };
      })
      .sort((a, b) => a.number - b.number);
  };

  /* ========= Data yükü ========= */
  const loadAll = async () => {
    try {
      setLoading(true);
      const res = await axios.get(ROOMS_URL, { params: { _ts: Date.now() } });
      const roomsApi = Array.isArray(res.data) ? res.data : [];
      setRooms(buildRoomsModel(roomsApi));
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

  const openRoom = (backendId) => {
    setSelectedId(backendId);
    setResvDate(todayYMD());
    setResvStart("");
    setResvEnd("");
    setResvCustomer("");
    setResvPhone("");
  };

  const closePopup = () => setSelectedId(null);

  /* ====== SERVER: PUT ilə status yaz ====== */
  const setRoomStatusOnServer = async (roomId, nextStatusUI) => {
    const serverStatus = statusToServer(nextStatusUI);
    const r = rooms.find((x) => x.id === roomId);
    if (!r) throw new Error("Room not found in state");

    // PUT tələb edir → room_num və room_chair_number da göndərilməlidir
    const payload = {
      room_num: r.number,
      room_chair_number: r.chairNumber ?? 4,
      room_status: serverStatus,
    };

    await axios.put(`${ROOMS_URL}${roomId}/`, payload, {
      headers: { "Content-Type": "application/json" },
    });
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

  const createReservation = async (roomModel) => {
    const err = validateReservationForm();
    if (err) {
      showNote(err, "error");
      throw new Error(err);
    }
    const reserved_time = `${resvStart}-${resvEnd}`;
    const payload = {
      room: roomModel.id,
      room_chair_number: roomModel.chairNumber ?? 4,
      date: resvDate,
      reserved_time,
      phone: resvPhone,
      customer: resvCustomer,
    };
    await axios.post(ROOM_RESERVATIONS_URL, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return reserved_time;
  };

  const changeRoomStatus = async (roomBackendId, newStatusUI) => {
    const prev = rooms.find((r) => r.id === roomBackendId);
    if (!prev) return;
    setSyncingId(roomBackendId);

    try {
      // Optimistic UI
      setRooms((p) =>
        p.map((r) =>
          r.id === roomBackendId
            ? { ...r, status: newStatusUI, color: statusColors[newStatusUI] || "#ccc" }
            : r
        )
      );

      await setRoomStatusOnServer(roomBackendId, newStatusUI);
      await loadAll();
      showNote("Status yeniləndi.", "success");
    } catch (e) {
      console.error(e);
      showNote(`Status dəyişmədi: ${getErrText(e)}`, "error");
      // revert
      setRooms((p) =>
        p.map((r) =>
          r.id === roomBackendId ? { ...r, status: prev.status, color: prev.color } : r
        )
      );
    } finally {
      setSyncingId(null);
    }
  };

  const computeRuntimeFlags = (m) => {
    const today = todayYMD();
    const nowMin = nowMinutes();
    const todays = (m.reservations || []).filter((r) => r.date === today);
    let activeNow = false;
    let startingSoon = false;
    let dynamicLabel = m.nextLabel || "";

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

  /* ====== AUTO SYNC: rezerv başlayanda → reserved; bitəndə → empty ====== */
  const safeAutoSetStatus = async (roomId, nextStatus) => {
    const key = String(roomId);
    const now = Date.now();
    const guard = autoOpsRef.current[key] || { lastStatus: null, ts: 0 };
    if (guard.lastStatus === nextStatus && now - guard.ts < 60000) return;

    autoOpsRef.current[key] = { lastStatus: nextStatus, ts: now };

    // Local optimistic
    setRooms((p) =>
      p.map((r) =>
        r.id === roomId ? { ...r, status: nextStatus, color: statusColors[nextStatus] || r.color } : r
      )
    );

    try {
      await setRoomStatusOnServer(roomId, nextStatus);
    } catch (err) {
      console.warn("Auto status sync failed:", getErrText(err));
    }
  };

  useEffect(() => {
    if (!rooms || rooms.length === 0) return;

    const today = todayYMD();
    const nowMin = nowMinutes();

    rooms.forEach((r) => {
      const todays = (r.reservations || []).filter((x) => x.date === today);
      let activeNow = false;
      for (const rv of todays) {
        const rng = parseTimeRange(rv.reserved_time);
        if (!rng) continue;
        if (nowMin >= rng.startMin && nowMin < rng.endMin) {
          activeNow = true;
          break;
        }
      }

      if (activeNow) {
        if (r.status !== "reserved") safeAutoSetStatus(r.id, "reserved");
      } else {
        if (r.status === "reserved") safeAutoSetStatus(r.id, "empty");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowTick, rooms]);

  return (
    <div className="admin-room-page">
      <div className="header-row">
        <h1>Kabinetlərin idarə edilməsi</h1>
        <div className="header-actions">
          <button onClick={loadAll} disabled={loading}>
            {loading ? "Yenilənir..." : "Yenilə"}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="legend">
        <h2>Rəng Kodları</h2>
        <div className="legend-items">
          <Legend color={statusColors.empty} label={statusNames.empty} />
          <Legend color={statusColors.reserved} label={statusNames.reserved} />
          <Legend color={statusColors.ordered} label={statusNames.ordered} />
          <Legend color={statusColors.waitingService} label={statusNames.waitingService} />
          <Legend color={statusColors.waitingBill} label={statusNames.waitingBill} />
        </div>
      </div>

      <div className="rooms-container">
        {rooms.map((m) => {
          const _tick = nowTick; // rerender üçün
          const { activeNow, startingSoon } = computeRuntimeFlags(m);
          const bgColor = activeNow ? statusColors.reserved : m.color;

          return (
            <div key={m.id} className="room-wrapper" onClick={() => openRoom(m.id)}>
              <div
                className={`room-shape ${activeNow ? "active-now" : startingSoon ? "starting-soon" : ""}`}
                style={{ backgroundColor: bgColor }}
              >
                <div className="room-number">{m.number}</div>

                <div className="chair chair-top"></div>
                <div className="chair chair-right"></div>
                <div className="chair chair-bottom"></div>
                <div className="chair chair-left"></div>
              </div>
            </div>
          );
        })}

        {!loading && rooms.length === 0 && (
          <div className="empty-state">Kabinet tapılmadı. (GET /api/rooms/)</div>
        )}
      </div>

      {selectedRoom && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="room-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closePopup}>×</button>

            <h2 className="popup-title">Kabinet {selectedRoom.number}</h2>

            <div className="popup-body">
              <div className="status-info">
                <div
                  className="status-color"
                  style={{ backgroundColor: statusColors[selectedRoom.status] || "#ccc" }}
                />
                <span>Status: {statusNames[selectedRoom.status]}</span>
              </div>

              <div className="full-info">
                <div className="info-row">
                  <span className="info-label">Stul sayı:</span>
                  <span className="info-value">{selectedRoom.chairNumber ?? "—"}</span>
                </div>

                {selectedRoom.status !== "empty" && (
                  <div className="info-row">
                    <span className="info-label">Yaradılma:</span>
                    <span className="info-value">{toAzDateTime(selectedRoom.created_at)}</span>
                  </div>
                )}
              </div>

              {/* Rezervlər */}
              <div className="reservations-box">
                <div className="box-head">Rezervlər (bugün və sonrası)</div>
                <div className="resv-list">
                  {selectedRoom.reservations
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
                        <span className="cust"> — {r.phone}{r.customer ? `, ${r.customer}` : ""}</span>
                      </div>
                    ))}
                  {selectedRoom.reservations.filter((r) => r.date >= todayYMD()).length === 0 && (
                    <div className="resv-empty">Rezerv yoxdur.</div>
                  )}
                </div>
              </div>

              {/* Rezerv formu */}
              <div className="reservation-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tarix</label>
                    <input type="date" value={resvDate} onChange={(e) => setResvDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Başlama saatı</label>
                    <input type="time" value={resvStart} onChange={(e) => setResvStart(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Bitmə saatı</label>
                    <input type="time" value={resvEnd} onChange={(e) => setResvEnd(e.target.value)} />
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
                        setSyncingId(selectedRoom.id);
                        const reservedTime = await createReservation(selectedRoom);
                        await loadAll();
                        showNote(`Rezerv yaradıldı (${reservedTime}).`, "success");
                      } catch {/* artıq bildirilib */}
                      finally { setSyncingId(null); }
                    }}
                    disabled={syncingId === selectedRoom.id}
                  >
                    Rezerv et
                  </button>
                </div>
              </div>

              {/* Status düymələri */}
              <div className="status-controls">
                <h3>Statusu Dəyişdir</h3>
                <div className="status-buttons">
                  <button
                    onClick={() => changeRoomStatus(selectedRoom.id, "empty")}
                    className={selectedRoom.status === "empty" ? "active" : ""}
                    disabled={syncingId === selectedRoom.id}
                  >
                    Boş
                  </button>

                  <button
                    onClick={() => changeRoomStatus(selectedRoom.id, "reserved")}
                    className={selectedRoom.status === "reserved" ? "active" : ""}
                    disabled={syncingId === selectedRoom.id}
                  >
                    Rezerv
                  </button>

                  <button
                    onClick={() => changeRoomStatus(selectedRoom.id, "ordered")}
                    className={selectedRoom.status === "ordered" ? "active" : ""}
                    disabled={syncingId === selectedRoom.id}
                  >
                    Sifariş
                  </button>

                  <button
                    onClick={() => changeRoomStatus(selectedRoom.id, "waitingService")}
                    className={selectedRoom.status === "waitingService" ? "active" : ""}
                    disabled={syncingId === selectedRoom.id}
                  >
                    Xidmət gözləyir
                  </button>

                  <button
                    onClick={() => changeRoomStatus(selectedRoom.id, "waitingBill")}
                    className={selectedRoom.status === "waitingBill" ? "active" : ""}
                    disabled={syncingId === selectedRoom.id}
                  >
                    Hesab gözləyir
                  </button>
                </div>
                {syncingId === selectedRoom.id && <p className="hint">Yazılır...</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
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

export default AdminRoomPage;
