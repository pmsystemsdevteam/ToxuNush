import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Search,
  ExpandMore,
  Event,
  Restaurant,
  TableRestaurant,
  AccessTime,
  Person,
  Phone,
  Receipt,
} from "@mui/icons-material";
import "./AdminTableAllOrderPage.scss";

// API service functions
const apiService = {
  fetchBaskets: () =>
    fetch("http://172.20.5.167:8001/api/baskets/").then((r) => r.json()),
  fetchTables: () =>
    fetch("http://172.20.5.167:8001/api/tables/").then((r) => r.json()),
  fetchReservations: () =>
    fetch("http://172.20.5.167:8001/api/reservations/").then((r) => r.json()),
};

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function AdminTableAllOrderPage() {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [baskets, setBaskets] = useState([]);
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [basketsData, tablesData, reservationsData] = await Promise.all([
          apiService.fetchBaskets(),
          apiService.fetchTables(),
          apiService.fetchReservations(),
        ]);

        setBaskets(basketsData);
        setTables(tablesData);
        setReservations(reservationsData);
        setError(null);
      } catch (err) {
        setError(
          "Failed to fetch data. Please check your connection and try again."
        );
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filteredBaskets = baskets.filter(
    (basket) =>
      basket.table?.table_num.toString().includes(searchTerm) ||
      basket.created_at.includes(searchTerm) ||
      basket.items.some(
        (item) =>
          item.name_az.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.name_ru.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const filteredTables = tables.filter(
    (table) =>
      table.table_num.toString().includes(searchTerm) ||
      table.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.reservations.some(
        (reservation) =>
          reservation.customer
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          reservation.phone.includes(searchTerm)
      )
  );

  const filteredReservations = reservations.filter(
    (reservation) =>
      reservation.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.phone.includes(searchTerm) ||
      reservation.date.includes(searchTerm) ||
      reservation.reserved_time.includes(searchTerm)
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "empty":
        return "default"; // boz rəng
      case "reserved":
        return "error"; // qırmızı rəng
      case "ordered":
        return "success"; // yaşıl rəng
      case "waitingService":
        return "success"; // yaşıl rəng
      case "waitingBill":
        return "info"; // mavi rəng
      case "waitingFood":
        return "warning"; // sarı rəng (əlavə status)
      default:
        return "default";
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "empty":
        return { text: "Boş", color: "default" }; // boz rəng
      case "reserved":
        return { text: "Rezerv", color: "error" }; // qırmızı rəng
      case "ordered":
        return { text: "Dolu", color: "success" }; // yaşıl rəng
      case "waitingService":
        return { text: "Dolu", color: "success" }; // yaşıl rəng
      case "waitingBill":
        return { text: "Hesab gözləyir", color: "info" }; // mavi rəng
      case "waitingFood":
        return { text: "Dolu", color: "success" }; // sarı rəng
      default:
        return { text: status, color: "default" };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

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

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box className="admin-table-order-page">
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        className="page-title"
      >
        Table and Order Management
      </Typography>

      <Paper elevation={2} className="search-paper">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by customer name, table number, date(yyyy-mm-dd), or phone..."
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

      <Paper elevation={2} className="tabs-paper">
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="admin tabs"
        >
          <Tab icon={<TableRestaurant />} label="Tables" />
          <Tab icon={<Receipt />} label="Orders" />
          <Tab icon={<Event />} label="Reservations" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h5" gutterBottom>
            Table Status
          </Typography>
          <Grid container spacing={3}>
            {filteredTables.map((table) => (
              <Grid item xs={12} md={6} lg={4} key={table.id}>
                <Card variant="outlined" className="table-card">
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="h6" component="h2">
                        Table #{table.table_num}
                      </Typography>
                      <Chip
                        label={getStatusInfo(table.status).text}
                        color={getStatusInfo(table.status).color}
                        size="small"
                      />
                    </Box>

                    <Typography color="textSecondary" gutterBottom>
                      Chairs: {table.chair_number} people
                    </Typography>

                    <Typography variant="body2" className="created-date">
                      Created: {formatDate(table.created_at)}
                    </Typography>

                    {table.reservations && table.reservations.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" gutterBottom>
                          Reservations:
                        </Typography>
                        {table.reservations.map((reservation) => (
                          <Box
                            key={reservation.id}
                            className="reservation-item"
                          >
                            <Typography variant="body2">
                              <Person fontSize="small" /> {reservation.customer}
                            </Typography>
                            <Typography variant="body2">
                              <Phone fontSize="small" /> {reservation.phone}
                            </Typography>
                            <Typography variant="body2">
                              <Event fontSize="small" /> {reservation.date} |{" "}
                              {reservation.reserved_time}
                            </Typography>
                          </Box>
                        ))}
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" gutterBottom>
            Order History
          </Typography>
          {filteredBaskets.map((basket) => (
            <Accordion key={basket.id} className="order-accordion">
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box
                  width="100%"
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography>Order #{basket.id}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Table #{basket.table?.table_num} •{" "}
                      {formatDate(basket.created_at)}
                    </Typography>
                  </Box>
                  <Typography variant="h6">${basket.total_cost}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="subtitle2" gutterBottom>
                  Items:
                </Typography>
                {basket.items.map((item) => (
                  <Box
                    key={item.id}
                    display="flex"
                    justifyContent="space-between"
                    mb={1}
                  >
                    <Typography variant="body2">
                      {item.name_en} (x{item.count})
                    </Typography>
                    <Typography variant="body2">${item.cost}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Service Cost:</Typography>
                  <Typography variant="body2">
                    ${basket.service_cost}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Total Cost:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    ${basket.total_cost}
                  </Typography>
                </Box>
                {basket.note && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2">
                      <strong>Note:</strong> {basket.note}
                    </Typography>
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h5" gutterBottom>
            Reservation History
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Table</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Person sx={{ mr: 1 }} fontSize="small" />
                        {reservation.customer}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Phone sx={{ mr: 1 }} fontSize="small" />
                        {reservation.phone}
                      </Box>
                    </TableCell>
                    <TableCell>Table #{reservation.table}</TableCell>
                    <TableCell>{reservation.date}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <AccessTime sx={{ mr: 1 }} fontSize="small" />
                        {reservation.reserved_time}
                      </Box>
                    </TableCell>
                    <TableCell>{formatDate(reservation.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
    </Box>
  );
}

export default AdminTableAllOrderPage;
