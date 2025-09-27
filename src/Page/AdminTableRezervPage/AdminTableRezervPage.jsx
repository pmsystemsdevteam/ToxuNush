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
  Refresh as RefreshIcon,
  Event as EventIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import {
  LocalizationProvider,
  DatePicker,
  TimePicker,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { enUS } from "date-fns/locale";
import { FaChair, FaUtensils } from "react-icons/fa";
import "./AdminTableRezervPage.scss";

const API_URL = "http://192.168.0.164:8000/api/reservations/";

const AdminTableRezervPage = () => {
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
      if (!response.ok) {
        throw new Error("Məlumatlar gətirilə bilmədi");
      }
      const data = await response.json();
      setReservations(data);
    } catch (err) {
      setError(err.message);
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (reservation) => {
    setCurrentReservation({ ...reservation });

    // Parse the reserved_time string to set start and end times
    const [start, end] = reservation.reserved_time.split("-");
    const [startHours, startMinutes] = start.split(":");
    const [endHours, endMinutes] = end.split(":");

    const startDate = new Date();
    startDate.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

    const endDate = new Date();
    endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

    setStartTime(startDate);
    setEndTime(endDate);
    setEditDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu rezervasiyanı silmək istədiyinizə əminsiniz?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Silinmə uğursuz oldu");
      }

      setReservations(reservations.filter((item) => item.id !== id));
      showNotification("Rezervasiya uğurla silindi", "success");
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const handleSave = async () => {
    try {
      // Format the time range from startTime and endTime
      const formattedStartTime = `${startTime
        .getHours()
        .toString()
        .padStart(2, "0")}:${startTime
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      const formattedEndTime = `${endTime
        .getHours()
        .toString()
        .padStart(2, "0")}:${endTime.getMinutes().toString().padStart(2, "0")}`;
      const reservedTime = `${formattedStartTime}-${formattedEndTime}`;

      const updatedReservation = {
        ...currentReservation,
        reserved_time: reservedTime,
      };

      const response = await fetch(`${API_URL}${currentReservation.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedReservation),
      });

      if (!response.ok) {
        throw new Error("Yenilənmə uğursuz oldu");
      }

      const result = await response.json();
      setReservations(
        reservations.map((item) => (item.id === result.id ? result : item))
      );

      setEditDialogOpen(false);
      showNotification("Rezervasiya uğurla yeniləndi", "success");
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentReservation({
      ...currentReservation,
      [name]: value,
    });
  };

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

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

  const getStatusColor = (date, time) => {
    const [startTime] = time.split("-");
    const [hours, minutes] = startTime.split(":");
    const reservationDateTime = new Date(date);
    reservationDateTime.setHours(parseInt(hours), parseInt(minutes));

    const now = new Date();

    if (reservationDateTime < now) {
      return "error"; // Keçmiş rezervasiya
    } else if (reservationDateTime.toDateString() === now.toDateString()) {
      return "warning"; // Bugünkü rezervasiya
    } else {
      return "success"; // Gələcək rezervasiya
    }
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
            <h1>Masa Rezervasiya İdarəetmə</h1>
            <p>Bütün masa rezervasiyalarının icmalı</p>
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
                    <span>Masa {reservation.table}</span>
                  </div>
                  <div className="detail-item">
                    <FaChair fontSize="small" />
                    <span>{reservation.chair_number} stul</span>
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
                  name="table"
                  label="Masa No"
                  value={currentReservation.table}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  name="chair_number"
                  label="Stul Sayı"
                  type="number"
                  value={currentReservation.chair_number}
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
                    value={new Date(currentReservation.date)}
                    onChange={(newValue) => {
                      const formattedDate = newValue
                        .toISOString()
                        .split("T")[0];
                      setCurrentReservation({
                        ...currentReservation,
                        date: formattedDate,
                      });
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

export default AdminTableRezervPage;
