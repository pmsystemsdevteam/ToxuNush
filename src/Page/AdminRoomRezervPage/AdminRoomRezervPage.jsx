import React, { useState, useEffect } from "react";
import {
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Chip,
  Alert,
  Typography,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  LocalizationProvider,
  DatePicker,
  TimePicker,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { enUS } from "date-fns/locale";
import { FaChair, FaUtensils } from "react-icons/fa";
import "./AdminRoomRezervPage.scss";
import { MdChair } from "react-icons/md";
const API_URL = "http://192.168.0.164:8000/api/room-reservations/";

const AdminRoomRezervPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentReservation, setCurrentReservation] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Məlumatlar gətirilə bilmədi");
      const data = await response.json();
      setReservations(data);
    } catch (err) {
      setError(err.message);
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const parseTimeRange = (range) => {
    const [s, e] = (range || "").split("-").map((t) => t.trim());
    const [sh = "00", sm = "00"] = (s || "").split(":");
    const [eh = "00", em = "00"] = (e || "").split(":");

    const sd = new Date();
    sd.setHours(parseInt(sh), parseInt(sm), 0, 0);
    const ed = new Date();
    ed.setHours(parseInt(eh), parseInt(em), 0, 0);
    return [sd, ed];
  };

  const handleEdit = (reservation) => {
    setCurrentReservation({ ...reservation });
    const [sd, ed] = parseTimeRange(reservation.reserved_time);
    setStartTime(sd);
    setEndTime(ed);
    setEditDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu rezervasiyanı silmək istədiyinizə əminsiniz?"))
      return;
    try {
      const response = await fetch(`${API_URL}${id}/`, { method: "DELETE" });
      if (!response.ok) throw new Error("Silinmə uğursuz oldu");
      setReservations((prev) => prev.filter((item) => item.id !== id));
      showNotification("Rezervasiya uğurla silindi", "success");
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const handleSave = async () => {
    try {
      const pad2 = (n) => String(n).padStart(2, "0");
      const formattedStartTime = `${pad2(startTime.getHours())}:${pad2(
        startTime.getMinutes()
      )}`;
      const formattedEndTime = `${pad2(endTime.getHours())}:${pad2(
        endTime.getMinutes()
      )}`;
      const reservedTime = `${formattedStartTime}-${formattedEndTime}`;

      const updatedReservation = {
        ...currentReservation,
        reserved_time: reservedTime,
      };

      const response = await fetch(`${API_URL}${currentReservation.id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedReservation),
      });

      if (!response.ok) throw new Error("Yenilənmə uğursuz oldu");

      const result = await response.json();
      setReservations((prev) =>
        prev.map((it) => (it.id === result.id ? result : it))
      );
      setEditDialogOpen(false);
      showNotification("Rezervasiya uğurla yeniləndi", "success");
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentReservation((prev) => ({ ...prev, [name]: value }));
  };

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };
  const handleCloseNotification = () =>
    setNotification((n) => ({ ...n, open: false }));

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("az-AZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString("az-AZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (dateStr, timeRange) => {
    const [s] = (timeRange || "").split("-").map((t) => t.trim());
    const [h = "00", m = "00"] = (s || "").split(":");
    const dt = new Date(dateStr);
    dt.setHours(parseInt(h), parseInt(m), 0, 0);

    const now = new Date();
    if (dt < now) return "error"; // keçmiş
    if (dt.toDateString() === now.toDateString()) return "warning"; // bu gün
    return "success"; // gələcək
  };

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.phone.includes(searchTerm);

    const matchesDate = filterDate
      ? reservation.date === filterDate.toISOString().split("T")[0]
      : true;

    return matchesSearch && matchesDate;
  });

  if (loading) {
    return (
      <div className="admin-rezerv-page loading">
        <CircularProgress size={60} thickness={4} />
        <p>Rezervasiyalar yüklənir...</p>
      </div>
    );
  }

  return (
    <div className="admin-rezerv-page">
      <div className="page-header">
        <div className="header-content">
          <div className="title-section">
            <h1>Kabinet Rezervasiya İdarəetmə</h1>
            <p>Bütün kabinet rezervasiyalarının icmalı</p>
          </div>
        </div>
      </div>

      <Paper elevation={0} className="filters-section">
        <div className="filters-content">
          <TextField
            placeholder="Müştəri və ya telefon nömrəsi ilə axtarış"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            size="small"
          />
          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={enUS}
          >
            <DatePicker
              label="Tarixə görə filtrlə"
              value={filterDate}
              onChange={(newValue) => setFilterDate(newValue)}
              renderInput={(params) => <TextField {...params} size="small" />}
              className="date-filter"
            />
          </LocalizationProvider>
          {filterDate && (
            <Chip
              label="Filtri təmizlə"
              onClick={() => setFilterDate(null)}
              color="primary"
              variant="outlined"
            />
          )}
        </div>
      </Paper>

      {error && (
        <Alert severity="error" className="error-alert">
          {error}
        </Alert>
      )}

      <div className="reservations-grid">
        {filteredReservations.length > 0 ? (
          filteredReservations.map((reservation) => (
            <Card
              key={reservation.id}
              className="reservation-card has-reservation"
            >
              <div className="pulse-effect"></div>
              <CardContent>
                <div className="card-header">
                  <div className="reservation-info">
                    <Typography variant="h6" className="customer-name">
                      {reservation.customer}
                    </Typography>
                    <Chip
                      label={formatDate(reservation.date)}
                      icon={<EventIcon />}
                      size="small"
                      color={getStatusColor(
                        reservation.date,
                        reservation.reserved_time
                      )}
                    />
                  </div>
                  <div className="action-buttons">
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(reservation)}
                      aria-label="edit"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(reservation.id)}
                      aria-label="delete"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </div>
                </div>

                <div className="reservation-details">
                  <div className="detail-item">
                    <FaUtensils fontSize="small" />
                    <span>Kabinet {reservation.room}</span>
                  </div>
                  <div className="detail-item">
                    <MdChair fontSize="small" />
                    <span>{reservation.room_chair_number} stul</span>
                  </div>
                  <div className="detail-item">
                    <EventIcon fontSize="small" />
                    <span>{reservation.reserved_time}</span>
                  </div>
                  <div className="detail-item">
                    <PhoneIcon fontSize="small" />
                    <span>{reservation.phone}</span>
                  </div>
                </div>

                <div className="card-footer">
                  <Typography variant="caption" color="textSecondary">
                    {formatDateTime(reservation.created_at)}
                  </Typography>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="no-reservations">
            <EventIcon className="no-data-icon" />
            <Typography variant="h6">
              {searchTerm || filterDate
                ? "Axtarışa uyğun nəticə tapılmadı"
                : "Heç bir rezervasiya tapılmadı"}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => {
                setSearchTerm("");
                setFilterDate(null);
              }}
            >
              Bütün rezervasiyaları göstər
            </Button>
          </div>
        )}
      </div>

      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        className="edit-dialog"
      >
        <DialogTitle className="dialog-title">
          Rezervasiyanı Redaktə Et
        </DialogTitle>
        <DialogContent>
          {currentReservation && (
            <div className="edit-form">
              <div className="form-row">
                <TextField
                  name="room"
                  label="Kabinet No"
                  value={currentReservation.room}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  name="room_chair_number"
                  label="Stul Sayı"
                  type="number"
                  value={currentReservation.room_chair_number}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                />
              </div>

              <div className="form-row" style={{ marginBottom: "10px" }}>
                <LocalizationProvider
                  dateAdapter={AdapterDateFns}
                  adapterLocale={enUS}
                >
                  <DatePicker
                    label="Tarix"
                    value={
                      currentReservation.date
                        ? new Date(currentReservation.date)
                        : null
                    }
                    onChange={(newValue) => {
                      const formattedDate =
                        newValue?.toISOString()?.split("T")[0] || "";
                      setCurrentReservation((prev) => ({
                        ...prev,
                        date: formattedDate,
                      }));
                    }}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth margin="normal" />
                    )}
                  />
                </LocalizationProvider>
              </div>

              <div className="form-row">
                <LocalizationProvider
                  dateAdapter={AdapterDateFns}
                  adapterLocale={enUS}
                >
                  <TimePicker
                    label="Başlama vaxtı"
                    value={startTime}
                    onChange={(newValue) => setStartTime(newValue)}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth margin="normal" />
                    )}
                  />
                  <TimePicker
                    label="Bitmə vaxtı"
                    value={endTime}
                    onChange={(newValue) => setEndTime(newValue)}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth margin="normal" />
                    )}
                  />
                </LocalizationProvider>
              </div>

              <TextField
                name="customer"
                label="Müştəri Adı"
                value={currentReservation.customer}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />

              <TextField
                name="phone"
                label="Telefon"
                value={currentReservation.phone}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </div>
          )}
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={() => setEditDialogOpen(false)} variant="outlined">
            Ləğv et
          </Button>
          <Button onClick={handleSave} variant="contained" className="save-btn">
            Yadda saxla
          </Button>
        </DialogActions>
      </Dialog>

      {notification.open && (
        <div className={`notification ${notification.severity}`}>
          <span>{notification.message}</span>
          <button onClick={handleCloseNotification}>×</button>
        </div>
      )}
    </div>
  );
};

export default AdminRoomRezervPage;
