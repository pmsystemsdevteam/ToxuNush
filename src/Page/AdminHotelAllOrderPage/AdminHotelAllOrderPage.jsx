import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import {
  Search,
  ExpandMore,
  Person,
  Phone,
  Event,
} from "@mui/icons-material";
import "./AdminHotelAllOrderPage.scss";

// ===== API service (NEW endpoints) =====
const apiService = {
  fetchOrders: () =>
    fetch("http://192.168.0.164:8000/api/room-ordered/").then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }),
  fetchHotelRooms: () =>
    fetch("http://192.168.0.164:8000/api/hotel-room-number/").then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }),
};

// ===== Helpers =====
const fmtAZ = (iso) => {
  try {
    return new Date(iso).toLocaleString("az-Latn-AZ");
  } catch {
    return iso ?? "";
  }
};

const todayLocalYMD = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date());

const dateToLocalYMD = (iso) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(iso));

const AZN = (s) => `${s ?? "0.00"} AZN`;

function AdminHotelAllOrderPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState([]); // room-ordered
  const [hotelRooms, setHotelRooms] = useState([]); // hotel-room-number
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [ordersData, roomsData] = await Promise.all([
          apiService.fetchOrders(),
          apiService.fetchHotelRooms(),
        ]);
        if (!cancelled) {
          setOrders(Array.isArray(ordersData) ? ordersData : []);
          setHotelRooms(Array.isArray(roomsData) ? roomsData : []);
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setError(
            "Məlumatlar yüklənmədi. Şəbəkəni yoxlayın və yenidən cəhd edin."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // roomId -> number xəritəsi
  const roomIdToNumber = useMemo(() => {
    const map = new Map();
    for (const r of hotelRooms) map.set(Number(r.id), Number(r.number));
    return map;
  }, [hotelRooms]);

  // Axtarış filtri (Orders)
  const filterOrdersBySearch = (list) => {
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter((o) => {
      const roomNum = o.hotel_room
        ? String(roomIdToNumber.get(Number(o.hotel_room)) ?? o.hotel_room)
        : "";
      const customer = (o.customer || "").toLowerCase();
      const phone = (o.phone || "").toLowerCase();
      const created = (o.created_at || "").toLowerCase();
      const itemMatch = Array.isArray(o.items)
        ? o.items.some(
            (it) =>
              (it.name_az || "").toLowerCase().includes(q) ||
              (it.name_en || "").toLowerCase().includes(q) ||
              (it.name_ru || "").toLowerCase().includes(q)
          )
        : false;
      return (
        roomNum.includes(q) ||
        customer.includes(q) ||
        phone.includes(q) ||
        created.includes(q) ||
        itemMatch
      );
    });
  };

  // Sırala & böl
  const allOrdersSorted = useMemo(
    () => orders.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [orders]
  );

  const allOrdersFiltered = useMemo(
    () => filterOrdersBySearch(allOrdersSorted),
    [allOrdersSorted, searchTerm]
  );

  const todayYMD = todayLocalYMD();
  const isToday = (iso) => dateToLocalYMD(iso) === todayYMD;

  const todayOrdersFiltered = useMemo(
    () => allOrdersFiltered.filter((o) => isToday(o.created_at)),
    [allOrdersFiltered]
  );

  // Otaqlar siyahısı
  const roomsSorted = useMemo(
    () => hotelRooms.slice().sort((a, b) => Number(a.number) - Number(b.number)),
    [hotelRooms]
  );

  // Xülasə
  const totalRooms = hotelRooms.length;
  const totalOrdersToday = todayOrdersFiltered.length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box className="admin-room-pagee">
      <Typography variant="h4" component="h1" gutterBottom className="page-title">
        Hotel Rooms & Orders
      </Typography>

      <Paper elevation={2} className="search-paper">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Axtar: otaq nömrəsi, müştəri, telefon, tarix (YYYY-MM-DD) və ya məhsul adı..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* ==== İKİ PANEL (QUTU) ==== */}
      <div className="panels-grid">
        {/* Panel 1: Rooms • Today */}
        <Paper elevation={2} className="panel">
          <Box className="panel-header">
            <Typography variant="h5">Rooms • Today</Typography>
            <Stack direction="row" spacing={1}>
              <Chip label={`Rooms: ${totalRooms}`} size="small" />
              <Chip color="success" label={`Orders today: ${totalOrdersToday}`} size="small" />
            </Stack>
          </Box>

          {roomsSorted.length === 0 ? (
            <Alert severity="info">Heç bir otaq tapılmadı.</Alert>
          ) : (
            <Box className="compact-rooms-container">
              <Grid container spacing={2}>
                {roomsSorted.map((room) => {
                  const todaysForRoom = todayOrdersFiltered.filter(
                    (o) => Number(o.hotel_room) === Number(room.id)
                  );
                  const count = todaysForRoom.length;
                  return (
                    <Grid item xs={6} sm={4} md={3} key={room.id}>
                      <Card variant="outlined" className="compact-room-card">
                        <CardContent className="compact-room-content">
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="subtitle1" component="h2">
                              #{room.number}
                            </Typography>
                            <Chip
                              label={count > 0 ? `${count} order(s)` : "No orders"}
                              color={count > 0 ? "primary" : "default"}
                              size="small"
                            />
                          </Box>

                          {count > 0 && (
                            <Box className="compact-orders-list">
                              {todaysForRoom.map((o) => (
                                <Accordion key={o.id} className="compact-order-accordion">
                                  <AccordionSummary 
                                    expandIcon={<ExpandMore />}
                                    className="compact-order-summary"
                                  >
                                    <Box width="100%">
                                      <Typography variant="body2">
                                        Order #{o.id}
                                      </Typography>
                                      <Typography variant="caption" color="textSecondary">
                                        {AZN(o.total_cost)}
                                      </Typography>
                                    </Box>
                                  </AccordionSummary>
                                  <AccordionDetails className="compact-order-details">
                                    <Grid container spacing={1} mb={1}>
                                      <Grid item xs={12}>
                                        <Typography variant="body2">
                                          <Person fontSize="small" /> {o.customer || "—"}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={12}>
                                        <Typography variant="body2">
                                          <Phone fontSize="small" /> {o.phone || "—"}
                                        </Typography>
                                      </Grid>
                                    </Grid>

                                    <Divider sx={{ my: 1 }} />

                                    <Typography variant="subtitle2" gutterBottom>
                                      Items:
                                    </Typography>
                                    {Array.isArray(o.items) && o.items.length > 0 ? (
                                      o.items.map((it) => (
                                        <Box
                                          key={it.id}
                                          display="flex"
                                          justifyContent="space-between"
                                          mb={0.5}
                                        >
                                          <Typography variant="caption">
                                            {(it.name_en || it.name_az || it.name_ru || "Item").substring(0, 15)}
                                            {((it.name_en || it.name_az || it.name_ru || "Item").length > 15) && '...'} (x{it.count})
                                          </Typography>
                                          <Typography variant="caption">{AZN(it.cost)}</Typography>
                                        </Box>
                                      ))
                                    ) : (
                                      <Typography variant="caption" color="textSecondary">
                                        No items
                                      </Typography>
                                    )}

                                    <Divider sx={{ my: 1 }} />

                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                      <Typography variant="caption">Service:</Typography>
                                      <Typography variant="caption">{AZN(o.service_cost)}</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between">
                                      <Typography variant="caption">Total:</Typography>
                                      <Typography variant="caption" fontWeight="bold">
                                        {AZN(o.total_cost)}
                                      </Typography>
                                    </Box>

                                    {o.note && (
                                      <>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="caption">
                                          <strong>Note:</strong> {o.note.substring(0, 50)}
                                          {o.note.length > 50 && '...'}
                                        </Typography>
                                      </>
                                    )}
                                  </AccordionDetails>
                                </Accordion>
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
        </Paper>

        {/* Panel 2: All Orders (historical) */}
        <Paper elevation={2} className="panel">
          <Box className="panel-header">
            <Typography variant="h5">All Orders</Typography>
            <Chip label={`${allOrdersFiltered.length} record(s)`} size="small" />
          </Box>

          {allOrdersFiltered.length === 0 ? (
            <Alert severity="info">Sifariş tapılmadı.</Alert>
          ) : (
            <Box className="all-orders-container">
              {allOrdersFiltered.map((o) => {
                const roomNum =
                  o.hotel_room != null
                    ? roomIdToNumber.get(Number(o.hotel_room)) ?? o.hotel_room
                    : null;
                return (
                  <Accordion key={o.id} className="order-accordion">
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box
                        width="100%"
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Box>
                          <Typography>Order #{o.id}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Room {roomNum ? `#${roomNum}` : "—"} • {fmtAZ(o.created_at)}
                          </Typography>
                        </Box>
                        <Typography variant="h6">{AZN(o.total_cost)}</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2} mb={1}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2">
                            <Person fontSize="small" /> {o.customer || "—"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2">
                            <Phone fontSize="small" /> {o.phone || "—"}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 1.5 }} />

                      <Typography variant="subtitle2" gutterBottom>
                        Items:
                      </Typography>
                      {Array.isArray(o.items) && o.items.length > 0 ? (
                        o.items.map((it) => (
                          <Box key={it.id} display="flex" justifyContent="space-between" mb={0.75}>
                            <Typography variant="body2">
                              {(it.name_en || it.name_az || it.name_ru || "Item")} (x{it.count})
                            </Typography>
                            <Typography variant="body2">{AZN(it.cost)}</Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No items
                        </Typography>
                      )}

                      <Divider sx={{ my: 1.5 }} />

                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2">Service Cost:</Typography>
                        <Typography variant="body2">{AZN(o.service_cost)}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Total Cost:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {AZN(o.total_cost)}
                        </Typography>
                      </Box>

                      {o.note && (
                        <>
                          <Divider sx={{ my: 1.5 }} />
                          <Typography variant="body2">
                            <strong>Note:</strong> {o.note}
                          </Typography>
                        </>
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          )}
        </Paper>
      </div>
    </Box>
  );
}

export default AdminHotelAllOrderPage;