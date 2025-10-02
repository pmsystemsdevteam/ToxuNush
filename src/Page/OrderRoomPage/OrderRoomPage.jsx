import React, { useState, useEffect, useRef } from "react";
import "./OrderRoomPage.scss";
import { useNavigate } from "react-router-dom";

// MUI
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  TextField,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

const CUSTOMER_KEY = "customerData";
const ROOM_ORDER_KEY = "roomOrder";
const PREFILL_KEY = "prefillCustomerForm";

// API
const ROOMS_API = "http://172.20.5.167:8001/api/hotel-room-number/";

function OrderRoomPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    roomNumber: "",
    reservation: false,
  });

  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Rooms (from API)
  const [rooms, setRooms] = useState([]); // [{id, number, created_at}]
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState("");

  const nav = useNavigate();
  const formRef = useRef(null);

  // Load rooms from API
  useEffect(() => {
    const ctrl = new AbortController();
    const load = async () => {
      try {
        setRoomsLoading(true);
        setRoomsError("");
        const res = await fetch(`${ROOMS_API}?_ts=${Date.now()}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `HTTP ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`
          );
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        // Sort ascending by number
        list.sort((a, b) => Number(a.number) - Number(b.number));
        setRooms(list);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setRoomsError("Otaqlar yüklənmədi.");
        }
      } finally {
        setRoomsLoading(false);
      }
    };
    load();
    return () => ctrl.abort();
  }, []);

  // Prefill only if PREFILL_KEY === "true"
  useEffect(() => {
    try {
      const allowPrefill =
        (localStorage.getItem(PREFILL_KEY) || "false") === "true";
      if (!allowPrefill) return;

      const saved = localStorage.getItem(CUSTOMER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData({
          firstName: parsed.firstName || "",
          lastName: parsed.lastName || "",
          phone: parsed.phone || "",
          roomNumber:
            typeof parsed.roomNumber === "number"
              ? String(parsed.roomNumber)
              : (parsed.roomNumber || "").toString(),
          reservation: !!parsed.reservation,
        });
        setIsSubmitted(!!parsed.reservation);
      }
    } catch (e) {
      console.warn("customerData parse error:", e);
    }
  }, []);

  // Validate
  useEffect(() => {
    const isValid =
      formData.firstName.trim() !== "" &&
      formData.lastName.trim() !== "" &&
      formData.phone.trim() !== "" &&
      formData.roomNumber.trim() !== "";
    setIsFormValid(isValid);
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // UI reset helper
  const resetFormUI = () => {
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      roomNumber: "",
      reservation: false,
    });
    setIsSubmitted(false);
    formRef.current?.reset?.();
  };

  // Submit: save to LS, roomOrder=true, PREFILL=false, reset UI, navigate
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const dataToSave = {
      ...formData,
      // roomNumber string -> number (saxlamaq istəyirsənsə rəqəm kimi də saxlaya bilərik)
      roomNumber: Number.isFinite(Number(formData.roomNumber))
        ? Number(formData.roomNumber)
        : formData.roomNumber,
    };
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(dataToSave));
    localStorage.setItem(ROOM_ORDER_KEY, "true");
    localStorage.setItem(PREFILL_KEY, "false");

    resetFormUI();

    alert(
      "Təsdiq edildi: roomOrder aktivdir. Məlumat localda saxlanıldı, forma boşaldıldı."
    );

    nav("/product");
  };

  return (
    <div className="order-room-page">
      <div className="container">
        <h1>
          <i className="fas fa-hotel"></i> Otaq Sifarişi
        </h1>
        <p>Zəhmət olmasa aşağıdakı məlumatları doldurun</p>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="order-form"
          autoComplete="off"
        >
          <div className="form-group">
            <label htmlFor="firstName">Ad</label>
            <TextField
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Adınızı daxil edin"
              required
              disabled={isSubmitted}
              autoComplete="off"
              fullWidth
              size="medium"
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Soyad</label>
            <TextField
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Soyadınızı daxil edin"
              required
              disabled={isSubmitted}
              autoComplete="off"
              fullWidth
              size="medium"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Telefon nömrəsi</label>
            <TextField
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Nömrənizi daxil edin"
              required
              disabled={isSubmitted}
              autoComplete="off"
              inputMode="tel"
              fullWidth
              size="medium"
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomNumber">Otaq nömrəsi</label>

            <div className="mui-select">
              <FormControl fullWidth disabled={isSubmitted || roomsLoading}>
                <InputLabel id="room-select-label">Otaq seçin</InputLabel>

                <Select
                  labelId="room-select-label"
                  id="roomNumber"
                  name="roomNumber"
                  label="Otaq seçin"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  MenuProps={{
                    PaperProps: { style: { maxHeight: 300 } },
                  }}
                >
                  {/* Show loading indicator inside menu if still loading */}
                  {roomsLoading && (
                    <MenuItem value="" disabled>
                      <CircularProgress size={20} />
                      <span style={{ marginLeft: 10 }}>Yüklənir...</span>
                    </MenuItem>
                  )}

                  {!roomsLoading && roomsError && (
                    <MenuItem value="" disabled>
                      {roomsError}
                    </MenuItem>
                  )}

                  {!roomsLoading &&
                    !roomsError &&
                    rooms.map((r) => (
                      <MenuItem key={r.id} value={String(r.number)}>
                        {r.number}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </div>
          </div>

          {/* Əgər rezervasiya checkbox-ı qalmasını istəyirsənsə */}
        

          <div className="form-actions">
            <button
              type="submit"
              className={`btn-confirm ${isFormValid ? "active" : "disabled"}`}
              disabled={!isFormValid}
            >
              Təsdiq et
            </button>
          </div>
        </form>

        <div className="info-box">
          <h3>
            <i className="fas fa-info-circle"></i> Əlavə məlumat
          </h3>
          <p>
            Otaq nömrənizi düzgün seçdiyinizə əmin olun. Sifarişiniz təsdiq
            edildikdən sonra otaq nömrəsini dəyişmək mümkün olmayacaq.
          </p>
        </div>
      </div>
    </div>
  );
}

export default OrderRoomPage;
