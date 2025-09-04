import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminPage from "../Page/AdminPage/AdminPage";
import AdminTablePage from "../Page/AdminTablePage/AdminTablePage";
import AdminProductPage from "../Page/AdminProdcutPage/AdminProductPage";
import AdminAddPage from "../Page/AdminAddPage/AdminAddPage";
import AdminEditPage from "../Page/AdminEditPage/AdminEditPage";
import AdminCatagoryAddPage from "../Page/AdminCatagoryAddPage/AdminCatagoryAddPage";
import AdminCategoryPage from "../Page/AdminCategoryPage/AdminCategoryPage";
import AdminCatagoryEditPage from "../Page/AdminCatagoryEditPage/AdminCatagoryEditPage";
import AdminArcitecturePage from "../Page/AdminArcitecturePage/AdminArcitecturePage";
import Dashboard from "./Dashboard/Dashboard";
import ScrollToTop from "../Components/ScrollToTop";
import AdminTableAddPage from "../Page/AdminTableAddPage/AdminTableAddPage";
import AdminRoomAddPage from "../Page/AdminRoomAddPage/AdminRoomAddPage";
import AdminRoomPage from "../Page/AdminRoomPage/AdminRoomPage";
import AdminRezervPage from "../Page/AdminRezervPage/AdminRezervPage";
import AdminTableRezervPage from "../Page/AdminTableRezervPage/AdminTableRezervPage";
import AdminRoomRezervPage from "../Page/AdminRoomRezervPage/AdminRoomRezervPage";
import AdminAllAddPage from "../Page/AdminAllAddPage/AdminAllAddPage";
import AdminAllOrderPage from "../Page/AdminAllOrderPage/AdminAllOrderPage";
import AdminRoomAllOrderPage from "../Page/AdminRoomAllOrderPage/AdminRoomAllOrderPage";
import AdminTableAllOrderPage from "../Page/AdminTableAllOrderPage/AdminTableAllOrderPage";
import AdminTimePage from "../Page/AdminTimePage/AdminTimePage";
import AdminHotelAddPage from "../Page/AdminHotelAddPage/AdminHotelAddPage";
import AdminHotelAllOrderPage from "../Page/AdminHotelAllOrderPage/AdminHotelAllOrderPage";
import AdminHotelPage from "../Page/AdminHotelPage/AdminHotelPage";

function AdminLayout() {
  return (
    <div className="admin-layout">
      <ScrollToTop behavior="smooth" />
      <Dashboard />
      <Routes>
        <Route path="/" element={<AdminPage />} />
        <Route path="tables" element={<AdminTablePage />} />
        <Route path="rooms" element={<AdminRoomPage />} />
        <Route path="hotel" element={<AdminHotelPage />} />

        <Route path="product" element={<AdminProductPage />} />
        <Route path="product/add" element={<AdminAddPage />} />
        <Route path="product/edit/:id" element={<AdminEditPage />} />

        <Route path="category" element={<AdminCatagoryAddPage />} />
        <Route path="category/add" element={<AdminCategoryPage />} />
        <Route path="category/edit/:id" element={<AdminCatagoryEditPage />} />

        <Route path="architecture" element={<AdminArcitecturePage />} />
        <Route path="time" element={<AdminTimePage />} />

        <Route path="rezerv" element={<AdminRezervPage />} />
        <Route path="rezerv/tables" element={<AdminTableRezervPage />} />
        <Route path="rezerv/rooms" element={<AdminRoomRezervPage />} />

        <Route path="add" element={<AdminAllAddPage />} />
        <Route path="add/tables" element={<AdminTableAddPage />} />
        <Route path="add/rooms" element={<AdminRoomAddPage />} />
        <Route path="add/hotel" element={<AdminHotelAddPage />} />

        <Route path="all" element={<AdminAllOrderPage />} />
        <Route path="all/tables" element={<AdminTableAllOrderPage />} />
        <Route path="all/rooms" element={<AdminRoomAllOrderPage />} />
        <Route path="all/hotel" element={<AdminHotelAllOrderPage />} />
      </Routes>
    </div>
  );
}

export default AdminLayout;
