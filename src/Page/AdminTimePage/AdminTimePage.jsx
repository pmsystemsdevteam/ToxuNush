import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Grid,
} from "@mui/material";
import {
  Save,
  Schedule,
  Restaurant as RestaurantIcon,
  OnlinePrediction,
  Undo,
} from "@mui/icons-material";
import axios from "axios";
import "./AdminTimePage.scss";

const API_URL = "http://172.20.5.167:8001/api/restoranttime/";

const hhmm = (s) => (s ? String(s).slice(0, 5) : "");
const toHHMMSS = (s) => {
  const v = String(s || "");
  return v.length === 5 ? `${v}:00` : v; // "09:00" -> "09:00:00"
};
const isValidHHMM = (v) => /^\d{2}:\d{2}$/.test(v);

const AdminTimePage = () => {
  const [timeData, setTimeData] = useState({
    restoran_start_time: "09:00",
    restoran_end_time: "16:00",
    online_start_time: "09:00",
    online_end_time: "18:00",
  });
  const [originalData, setOriginalData] = useState(null);
  const [rowId, setRowId] = useState(null); // mövcud qeyd id-si
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Yükləmə
  useEffect(() => {
    fetchTimeData();
  }, []);

  const fetchTimeData = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const { data } = await axios.get(API_URL, {
        headers: { "Content-Type": "application/json" },
      });

      let record = null;
      if (Array.isArray(data)) {
        if (data.length) {
          // ən son qeydi id-ə görə götür
          record = [...data].sort((a, b) => (a?.id ?? 0) - (b?.id ?? 0)).pop();
        }
      } else if (data && typeof data === "object") {
        record = data;
      }

      if (record) {
        const formatted = {
          restoran_start_time: hhmm(record.restoran_start_time),
          restoran_end_time: hhmm(record.restoran_end_time),
          online_start_time: hhmm(record.online_start_time),
          online_end_time: hhmm(record.online_end_time),
        };
        setTimeData(formatted);
        setOriginalData(formatted);
        setRowId(record.id ?? null);
      } else {
        // heç nə yoxdursa ilkin dəyərlər qalır, POST edəcəyik
        setOriginalData({
          restoran_start_time: "09:00",
          restoran_end_time: "16:00",
          online_start_time: "09:00",
          online_end_time: "18:00",
        });
        setRowId(null);
      }
    } catch (error) {
      console.error("Error fetching time data:", error);
      setMessage({
        type: "error",
        text: "Məlumatlar yüklənərkən xəta baş verdi.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // yalnız HH:mm qəbul edək
    setTimeData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const invalidFields = useMemo(() => {
    const bad = [];
    if (!isValidHHMM(timeData.restoran_start_time))
      bad.push("Restoran Başlama vaxtı");
    if (!isValidHHMM(timeData.restoran_end_time))
      bad.push("Restoran Bitmə vaxtı");
    if (!isValidHHMM(timeData.online_start_time))
      bad.push("Onlayn Başlama vaxtı");
    if (!isValidHHMM(timeData.online_end_time)) bad.push("Onlayn Bitmə vaxtı");
    return bad;
  }, [timeData]);

  const hasChanges = useMemo(() => {
    if (!originalData) return false;
    return JSON.stringify(timeData) !== JSON.stringify(originalData);
  }, [timeData, originalData]);

  const handleReset = () => {
    if (!originalData) return;
    setTimeData(originalData);
    setMessage({ type: "info", text: "Dəyişikliklər geri alındı." });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (invalidFields.length) {
      setMessage({
        type: "warning",
        text: `Xahiş edirik vaxt formatını düzəldin: ${invalidFields.join(
          ", "
        )}. (HH:mm)`,
      });
      return;
    }
    setSaving(true);
    setMessage({ type: "", text: "" });

    const payload = {
      restoran_start_time: toHHMMSS(timeData.restoran_start_time),
      restoran_end_time: toHHMMSS(timeData.restoran_end_time),
      online_start_time: toHHMMSS(timeData.online_start_time),
      online_end_time: toHHMMSS(timeData.online_end_time),
    };

    try {
      if (rowId) {
        // EDIT (PUT)
        await axios.put(`${API_URL}${rowId}/`, payload, {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        // CREATE (POST) – əgər backend bir ədəd qeyd gözləyirsə, bu hissə lazım olmaya bilər
        const { data } = await axios.post(API_URL, payload, {
          headers: { "Content-Type": "application/json" },
        });
        setRowId(data?.id ?? null);
      }

      setOriginalData(timeData);
      setMessage({ type: "success", text: "Vaxt uğurla yeniləndi!" });
    } catch (error) {
      console.error("Error updating time data:", error);
      const detail =
        error?.response?.data && typeof error.response.data === "object"
          ? JSON.stringify(error.response.data)
          : "Yeniləmə uğursuz oldu. Xahiş edirik yenidən cəhd edin.";
      setMessage({ type: "error", text: detail });
    } finally {
      setSaving(false);
    }
  };

  const getPreviewText = () =>
    `Restoran ${timeData.restoran_start_time} - ${timeData.restoran_end_time} saatları arasında, onlayn sifarişlər isə ${timeData.online_start_time} - ${timeData.online_end_time} saatları arasında xidmət göstərəcək.`;

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="admin-time-page">
      <Grid container spacing={3} display={"flex"}  justifyContent={"center"}>
         <Grid item xs={12} md={4}>
          <Paper elevation={2} className="preview-paper">
            <Typography variant="h5" gutterBottom className="preview-title">
              Təsdiqdən Əvvəl Baxış
            </Typography>

            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              p={2}
            >
              <Schedule color="primary" sx={{ fontSize: 48, mb: 2 }} />

              <Typography variant="body1" align="center" paragraph>
                {getPreviewText()}
              </Typography>

              <Divider sx={{ width: "100%", my: 2 }} />

              <Typography variant="body2" color="textSecondary" align="center">
                Dəyişiklikləri təsdiqlədikdən sonra yeni vaxt cədvəli dərhal
                tətbiq olunacaq.
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} className="time-form-paper">
            <Typography variant="h5" gutterBottom className="form-title">
              İş Vaxtlarını Tənzimlə
            </Typography>

            <form onSubmit={handleSubmit}>
              <Card variant="outlined" className="time-card">
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <RestaurantIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Restoran İş Vaxtları</Typography>
                  </Box>

                  <Box
                    display="flex"
                    alignItems="center"
                    flexWrap="wrap"
                    gap={2}
                  >
                    <TextField
                      label="Başlama vaxtı"
                      type="time"
                      name="restoran_start_time"
                      value={timeData.restoran_start_time}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                      error={!isValidHHMM(timeData.restoran_start_time)}
                      helperText={
                        !isValidHHMM(timeData.restoran_start_time)
                          ? "HH:mm formatında daxil edin"
                          : " "
                      }
                    />
                    <Typography variant="h6">-</Typography>
                    <TextField
                      label="Bitmə vaxtı"
                      type="time"
                      name="restoran_end_time"
                      value={timeData.restoran_end_time}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                      error={!isValidHHMM(timeData.restoran_end_time)}
                      helperText={
                        !isValidHHMM(timeData.restoran_end_time)
                          ? "HH:mm formatında daxil edin"
                          : " "
                      }
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined" className="time-card">
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <OnlinePrediction color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Onlayn Sifariş Vaxtları
                    </Typography>
                  </Box>

                  <Box
                    display="flex"
                    alignItems="center"
                    flexWrap="wrap"
                    gap={2}
                  >
                    <TextField
                      label="Başlama vaxtı"
                      type="time"
                      name="online_start_time"
                      value={timeData.online_start_time}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                      error={!isValidHHMM(timeData.online_start_time)}
                      helperText={
                        !isValidHHMM(timeData.online_start_time)
                          ? "HH:mm formatında daxil edin"
                          : " "
                      }
                    />
                    <Typography variant="h6">-</Typography>
                    <TextField
                      label="Bitmə vaxtı"
                      type="time"
                      name="online_end_time"
                      value={timeData.online_end_time}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                      error={!isValidHHMM(timeData.online_end_time)}
                      helperText={
                        !isValidHHMM(timeData.online_end_time)
                          ? "HH:mm formatında daxil edin"
                          : " "
                      }
                    />
                  </Box>
                </CardContent>
              </Card>

              <Box mt={3} display="flex" gap={1}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={
                    saving ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <Save />
                    )
                  }
                  disabled={saving || !hasChanges || invalidFields.length > 0}
                >
                  {saving ? "Yadda saxlanılır..." : "Yadda Saxla"}
                </Button>

                <Button
                  type="button"
                  variant="outlined"
                  size="large"
                  color="inherit"
                  startIcon={<Undo />}
                  disabled={!hasChanges || saving}
                  onClick={handleReset}
                >
                  Geri al
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>

      
      </Grid>
    </Box>
  );
};

export default AdminTimePage;
