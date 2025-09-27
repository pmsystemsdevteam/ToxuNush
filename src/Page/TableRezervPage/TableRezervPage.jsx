import React, { useEffect, useMemo, useState } from "react";
import {
  LocalizationProvider,
  DatePicker,
  DesktopTimePicker,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { TextField, Button, Tooltip } from "@mui/material";
import { enUS } from "date-fns/locale";
import "./TableRezervPage.scss";

const TABLES_API = "http://192.168.0.164:8000/api/tables/";
const RES_API = "http://192.168.0.164:8000/api/reservations/";

/* ===== Util ===== */
const pad2 = (n) => String(n).padStart(2, "0");
const toHHMM = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const timeRangeToMinutes = (rangeStr) => {
  const [s, e] = String(rangeStr || "").split("-");
  const [sh, sm] = (s || "00:00").split(":").map((x) => parseInt(x, 10) || 0);
  const [eh, em] = (e || "00:00").split(":").map((x) => parseInt(x, 10) || 0);
  return { start: sh * 60 + sm, end: eh * 60 + em };
};
const minutesOfDate = (d) => d.getHours() * 60 + d.getMinutes();
const rangesOverlap = (aStart, aEnd, bStart, bEnd) =>
  aStart < bEnd && aEnd > bStart;

const formatLocalYMD = (d) => {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const da = pad2(d.getDate());
  return `${y}-${m}-${da}`;
};

const withTs = (url) =>
  url + (url.includes("?") ? "&" : "?") + `_ts=${Date.now()}`;
const fetchJson = async (url) => {
  const res = await fetch(withTs(url), { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `HTTP ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`
    );
  }
  return res.json();
};

/* Backend status setləri */
const OTHER_STATUSES = new Set([
  "ordered",
  "waitingFood",
  "waitingWaiter",
  "waitingBill",
]);

/* UI class xəritəsi: empty → empty, reserved → reserved, digərləri → occupied (göy) */
const statusToClass = (backendStatus, hasFuture) => {
  if (backendStatus === "empty") return "empty";
  if (backendStatus === "reserved") return "reserved";
  if (OTHER_STATUSES.has(backendStatus)) return "occupied";
  return hasFuture ? "occupied" : "empty";
};

const statusToLabel = (status) => {
  switch (status) {
    case "empty":
      return "Boş";
    case "reserved":
      return "Rezerv";
    case "ordered":
      return "Sifariş";
    case "waitingFood":
      return "Yemək gözləyir";
    case "waitingWaiter":
      return "Ofisiant gözləyir";
    case "waitingBill":
      return "Hesab gözləyir";
    default:
      return "Boş";
  }
};

/* Tarix + saatı bir Date-də birləşdir */
const combineDateTime = (dateObj, timeObj) => {
  if (!dateObj || !timeObj) return null;
  const d = new Date(dateObj);
  const t = new Date(timeObj);
  const res = new Date(d);
  res.setHours(t.getHours(), t.getMinutes(), 0, 0);
  return res;
};

function TableRezervPage() {
  // Data
  const [masalar, setMasalar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI seçimi
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isReservationFormOpen, setIsReservationFormOpen] = useState(false);

  // Form
  const [reservationDate, setReservationDate] = useState(null);
  const [reservationTime, setReservationTime] = useState(null);
  const [duration, setDuration] = useState("");
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [saving, setSaving] = useState(false);

  // Overlap UI
  const [conflicts, setConflicts] = useState([]);
  const [existingForDate, setExistingForDate] = useState([]);

  // Yeni: 1 saatlıq bloklama üçün xəbərdarlıq
  const [blockedWindowMsg, setBlockedWindowMsg] = useState("");

  const todayStr = useMemo(() => formatLocalYMD(new Date()), []);

  /* Load */
  const loadTables = async () => {
    setError(null);
    setLoading(true);
    try {
      const tData = await fetchJson(TABLES_API);
      setMasalar(Array.isArray(tData) ? tData : []);
    } catch (e) {
      setError(e?.message || "Naməlum xəta");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadTables();
  }, []);

  const refreshTables = async () => {
    try {
      const tData = await fetchJson(TABLES_API);
      setMasalar(Array.isArray(tData) ? tData : []);
    } catch (e) {
      console.warn("Refresh tables error:", e);
    }
  };

  const selectedTable = useMemo(
    () => masalar.find((t) => t.id === selectedTableId) || null,
    [masalar, selectedTableId]
  );

  const activeReservation = useMemo(() => {
    if (!selectedTable) return null;
    const list = Array.isArray(selectedTable.reservations)
      ? selectedTable.reservations
      : [];
    const todays = list.filter((r) => r.date === todayStr);
    return (
      todays.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )[0] || null
    );
  }, [selectedTable, todayStr]);

  /* Click handlers */
  const handleTableClick = (masa) => {
    setSelectedTableId(masa.id);
    setIsPopupOpen(true);
  };
  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedTableId(null);
  };

  /* Form helpers */
  const resetFormBlank = () => {
    setReservationDate(null);
    setReservationTime(null);
    setDuration("");
    setPhone("");
    setCustomerName("");
    setConflicts([]);
    setExistingForDate([]);
    setBlockedWindowMsg("");
  };
  const openReservationForm = () => {
    resetFormBlank();
    setIsPopupOpen(false);
    setIsReservationFormOpen(true);
  };
  const closeReservationForm = () => {
    setIsReservationFormOpen(false);
    setSelectedTableId(null);
    resetFormBlank();
  };

  /* Mövcud rezervlər & overlap */
  useEffect(() => {
    if (!selectedTable || !reservationDate) {
      setExistingForDate([]);
      setConflicts([]);
      return;
    }
    const dateStr = formatLocalYMD(reservationDate);
    const list = Array.isArray(selectedTable.reservations)
      ? selectedTable.reservations
      : [];
    const sameDate = list
      .filter((r) => r.date === dateStr)
      .sort(
        (a, b) =>
          timeRangeToMinutes(a.reserved_time).start -
          timeRangeToMinutes(b.reserved_time).start
      );
    setExistingForDate(sameDate);

    if (!reservationTime || !duration) {
      setConflicts([]);
      return;
    }
    const startMin = minutesOfDate(reservationTime);
    const durNum = Math.max(1, parseInt(duration, 10) || 1);
    const endDate = new Date(reservationTime);
    endDate.setHours(endDate.getHours() + durNum);
    const endMin = minutesOfDate(endDate);

    const overlapped = sameDate.filter((r) => {
      const { start, end } = timeRangeToMinutes(r.reserved_time);
      return rangesOverlap(startMin, endMin, start, end);
    });
    setConflicts(overlapped);
  }, [selectedTable, reservationDate, reservationTime, duration]);

  /* ===== 1 saatlıq pəncərə qaydası =====
     - empty: məhdudiyyət YOX (yalnız overlap)
     - reserved: məhdudiyyət YOX (yalnız overlap)
     - OTHER_STATUSES: bu gün üçün startDT < now + 60m isə BLOK
  */
  useEffect(() => {
    setBlockedWindowMsg("");

    if (!selectedTable || !reservationDate || !reservationTime) return;

    const st = selectedTable.status;
    if (st === "empty" || st === "reserved") return;

    if (OTHER_STATUSES.has(st)) {
      const startDT = combineDateTime(reservationDate, reservationTime);
      if (!startDT) return;

      const now = new Date();
      const isSameDay = formatLocalYMD(startDT) === formatLocalYMD(now);
      if (!isSameDay) return;

      const nowPlus1h = new Date(now.getTime() + 60 * 60 * 1000);
      if (startDT < nowPlus1h) {
        setBlockedWindowMsg(
          `Bu masa hazırda "${statusToLabel(
            st
          )}" statusundadır. Ən tez ${toHHMM(
            nowPlus1h
          )} üçün rezerv edə bilərsiniz.`
        );
      }
    }
  }, [selectedTable, reservationDate, reservationTime]);

  /* Payload & Submit */
  const buildPayload = () => {
    if (!selectedTableId) throw new Error("Masa seçilməyib.");
    if (!reservationDate || !reservationTime)
      throw new Error("Zəhmət olmasa tarix və saat seçin.");

    const formattedDate = formatLocalYMD(reservationDate);
    const start = new Date(reservationTime);
    const durNum = Number.isFinite(parseInt(duration, 10))
      ? Math.max(1, parseInt(duration, 10))
      : 1;
    const end = new Date(start);
    end.setHours(end.getHours() + durNum);

    const reservedRange = `${toHHMM(start)}-${toHHMM(end)}`;
    const chairNum =
      Number(
        masalar.find((m) => m.id === selectedTableId)?.chair_number
      ) || 4;

    return {
      table: selectedTableId,
      chair_number: chairNum,
      date: formattedDate,
      reserved_time: reservedRange,
      phone: phone || "",
      customer: customerName || "",
    };
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1) 1 saatlıq pəncərə qaydası
      if (blockedWindowMsg) {
        alert(blockedWindowMsg);
        return;
      }
      // 2) overlap
      if (conflicts.length > 0) {
        alert("Seçilmiş saat intervalı mövcud rezervlərlə üst-üstə düşür.");
        return;
      }

      setSaving(true);
      const payload = buildPayload();

      const res = await fetch(RES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          `POST alınmadı: ${res.status} ${res.statusText}${
            txt ? ` — ${txt}` : ""
          }`
        );
      }
      const saved = await res.json();

      // Optimistik: yalnız bu gün/gələcək olsa əlavə edək
      setMasalar((prev) =>
        prev.map((t) => {
          if (t.id !== saved.table) return t;
          const arr = Array.isArray(t.reservations) ? [...t.reservations] : [];
          const nowYmd = todayStr;
          if (saved.date >= nowYmd) arr.push(saved);
          arr.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return (
              timeRangeToMinutes(a.reserved_time).start -
              timeRangeToMinutes(b.reserved_time).start
            );
          });
          return { ...t, reservations: arr };
        })
      );

      alert("Rezervasiya yaradıldı!");
      await refreshTables();
      closeReservationForm();
    } catch (err) {
      console.error(err);
      alert("Xəta: " + (err.message || "Naməlum xəta"));
    } finally {
      setSaving(false);
    }
  };

  /* Render */
  if (loading) {
    return (
      <div className="rezerv-page loading">
        <div className="loader"></div>
        <p>Masalar yüklənir...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rezerv-page error">
        <i className="fas fa-exclamation-triangle"></i>
        <h2>Xəta baş verdi</h2>
        <p>{String(error)}</p>
        <button onClick={loadTables}>Yenidən yüklə</button>
      </div>
    );
  }

  const selectedRangeStr = (() => {
    if (!reservationTime || !duration) return "";
    const start = new Date(reservationTime);
    const end = new Date(reservationTime);
    end.setHours(end.getHours() + Math.max(1, parseInt(duration, 10) || 1));
    return `${toHHMM(start)}-${toHHMM(end)}`;
  })();

  const submitDisabled =
    saving || conflicts.length > 0 || Boolean(blockedWindowMsg);
  const tooltipTitle =
    conflicts.length > 0
      ? "Saat intervalı mövcud rezervlərlə ziddiyyət təşkil edir."
      : blockedWindowMsg
      ? blockedWindowMsg
      : "";

  return (
    <div className="rezerv-page">
      <div className="container">
        <header>
          <h1>Masa Rezervasiya Sistemi</h1>
        </header>

        {/* Legend: boş (boz), rezerv (qırmızı), digərləri (göy) */}
        <div className="status-info">
          <div className="status-item">
            <div className="status-color empty-color"></div>
            <span>Boş</span>
          </div>
          <div className="status-item">
            <div className="status-color reserved-color"></div>
            <span>Rezerv</span>
          </div>
          <div className="status-item">
            <div className="status-color occupied-color"></div>
            <span>Digər</span>
          </div>
        </div>

        <div className="masalar-grid">
          {masalar.map((masa) => {
            const list = Array.isArray(masa.reservations)
              ? masa.reservations
              : [];
            const hasFuture = list.length > 0;
            const uiClass = statusToClass(masa.status, hasFuture);

            return (
              <div
                key={masa.id}
                className={`masa ${uiClass}`}
                onClick={() => handleTableClick(masa)}
              >
                <div className="masa-number">
                  Masa {masa.table_num ?? masa.id}
                </div>
                <div className="masa-chairs">{masa.chair_number ?? 4} stul</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Masa popup */}
      {isPopupOpen && selectedTable && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closePopup}>
              <i className="fas fa-times"></i>
            </button>
            <h2 className="popup-title">Masa Məlumatları</h2>

            <div className="popup-info">
              <div className="info-item">
                <span className="info-label">Masa Nömrəsi:</span>
                <span className="info-value">
                  {selectedTable.table_num ?? selectedTable.id}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Stul Sayı:</span>
                <span className="info-value">
                  {selectedTable.chair_number ?? 4}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Vəziyyət:</span>
                <span
                  className={`info-value status-text ${
                    selectedTable?.status === "empty"
                      ? "empty"
                      : selectedTable?.status === "reserved"
                      ? "reserved"
                      : "occupied"
                  }`}
                >
                  {selectedTable?.status === "empty"
                    ? "Boş"
                    : selectedTable?.status === "reserved"
                    ? "Rezerv"
                    : "Dolu"}
                </span>
              </div>

              {activeReservation?.reserved_time && (
                <>
                  <div className="info-item">
                    <span className="info-label" style={{ color: "red" }}>
                      Son Rezerv (bugün):
                    </span>
                    <span className="info-value">
                      {activeReservation.reserved_time}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Tarix:</span>
                    <span className="info-value">{activeReservation.date}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Dəyişiklik:</span>
                    <span className="info-value">
                      {new Date(activeReservation.created_at).toLocaleString(
                        "az-AZ"
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="popup-actions">
              <button className="reserve-btn" onClick={openReservationForm}>
                Yeni Rezerv Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rezervasiya Formu */}
      {isReservationFormOpen && selectedTableId && (
        <div className="popup-overlay" onClick={closeReservationForm}>
          <div
            className="popup-content reservation-form"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={closeReservationForm}>
              <i className="fas fa-times"></i>
            </button>
            <h2 className="popup-title">Rezervasiya Formu</h2>

            {/* 1 saatlıq pəncərə banneri */}
            {blockedWindowMsg && (
              <div className="conflict-banner">
                <i className="fas fa-circle-exclamation"></i>
                {blockedWindowMsg}
              </div>
            )}

            {/* Overlap banner */}
            {conflicts.length > 0 && (
              <div className="conflict-banner">
                <i className="fas fa-triangle-exclamation"></i>
                Seçilmiş saat intervalı mövcud rezervlərlə üst-üstə düşür.
                <div className="conflict-list">
                  {conflicts.map((c) => (
                    <div key={c.id} className="conflict-item">
                      <span className="time">{c.reserved_time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mövcud rezervlər (seçilmiş tarix üçün) */}
            <div className="existing-reservations">
              <div className="head">
                <i className="fas fa-calendar-check"></i>
                {reservationDate
                  ? `Bu masada ${formatLocalYMD(
                      reservationDate
                    )} tarixi üçün mövcud rezervlər`
                  : "Tarix seçin — mövcud rezervlər göstəriləcək"}
              </div>
              <div className="slots">
                {reservationDate && existingForDate.length === 0 && (
                  <div className="slot empty">
                    Rezerv yoxdur — bütün saatlar boşdur.
                  </div>
                )}
                {existingForDate.map((r) => (
                  <div key={r.id} className="slot">
                    <span className="time">{r.reserved_time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Seçilən interval önizləmə */}
            {(() => {
              if (!reservationTime || !duration) return null;
              const start = new Date(reservationTime);
              const end = new Date(reservationTime);
              end.setHours(
                end.getHours() + Math.max(1, parseInt(duration, 10) || 1)
              );
              return (
                <div className="selected-range">
                  Seçilən interval:{" "}
                  <strong>
                    {toHHMM(start)}-{toHHMM(end)}
                  </strong>
                </div>
              );
            })()}

            <form
              onSubmit={handleReservationSubmit}
              className="reservation-form-content"
            >
              <div className="form-row">
                <div className="form-group">
                  <label>Masa Nömrəsi</label>
                  <TextField
                    value={
                      masalar.find((m) => m.id === selectedTableId)?.table_num ??
                      selectedTableId
                    }
                    disabled
                    fullWidth
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tarix</label>
                  <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    adapterLocale={enUS}
                  >
                    <DatePicker
                      value={reservationDate}
                      onChange={(v) => setReservationDate(v)}
                      renderInput={(params) => (
                        <TextField {...params} required fullWidth />
                      )}
                    />
                  </LocalizationProvider>
                </div>

                <div className="form-group">
                  <label>Başlama Saatı</label>
                  <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    adapterLocale={enUS}
                  >
                    <DesktopTimePicker
                      value={reservationTime}
                      onChange={(v) => setReservationTime(v)}
                      renderInput={(params) => (
                        <TextField {...params} required fullWidth />
                      )}
                    />
                  </LocalizationProvider>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Rezervasiya Müddəti (saat)</label>
                  <TextField
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    inputProps={{ min: 1, max: 12 }}
                    placeholder="məs: 2"
                    required
                    fullWidth
                  />
                </div>

                <div className="form-group">
                  <label>Telefon Nömrəsi</label>
                  <TextField
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    fullWidth
                    placeholder="+994501234567"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Müştəri Adı</label>
                  <TextField
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    fullWidth
                    placeholder="Ad Soyad"
                  />
                </div>
              </div>

              <div className="form-actions">
                <Button
                  type="button"
                  variant="outlined"
                  onClick={closeReservationForm}
                  className="cancel-btn"
                >
                  Ləğv Et
                </Button>

                <Tooltip title={tooltipTitle}>
                  <span style={{ width: "50%" }}>
                    <Button
                      type="submit"
                      variant="contained"
                      className={`submit-btn ${
                        submitDisabled ? "disabled" : ""
                      }`}
                      disabled={submitDisabled}
                      fullWidth
                    >
                      {saving ? "Göndərilir..." : "Yadda saxla"}
                    </Button>
                  </span>
                </Tooltip>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableRezervPage;
