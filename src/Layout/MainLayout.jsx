import React from "react";
import { Routes, Route, useParams, useLocation } from "react-router-dom";

import Navbar from "./Navbar/Navbar";
import HomePage from "../Page/HomePage/HomePage";
import ProductPage from "../Page/ProductPage/ProductPage";
import BasketPage from "../Page/BasketPage/BasketPage";
import Footer from "./Footer/Footer";
import BasketPopUp from "../Page/BasketPopUp/BasketPopUp";
import RezervationPage from "../Page/RezervationPage/RezervationPage";
import RoomRezervPage from "../Page/RoomRezervPage/RoomRezervPage";
import TableRezervPage from "../Page/TableRezervPage/TableRezervPage";
import OrderRoomPage from "../Page/OrderRoomPage/OrderRoomPage";
import MyOrderPage from "../Page/MyOrderPage/MyOrderPage";
import Navbar1 from "./Navbar/Navbar1";
import HomePage1 from "../Page/HomePage/HomePage1";
import ProductPage1 from "../Page/ProductPage/ProductPage1";

// LocalStorage açarları
const TABLE_KEY = "table";           // t gələndə yazılacaq
const ROOM_KEY = "room";             // r gələndə yazılacaq
const ACTIVE_CTX_KEY = "activeContext"; // 't' | 'r'

// Səhifə (route) dəyişdikdə yuxarı scroll et
function ScrollToTop() {
  const location = useLocation();

  React.useEffect(() => {
    // Əgər in-page anchor (#section) yoxdursa, yuxarı qalx
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.pathname, location.search, location.hash]);

  return null;
}

// "/:slug" (məs: 4t, 12r) gəldikdə localStorage-ə yazır,
// amma həmişə HomePage göstərir.
function HomeRouteBridge() {
  const { slug } = useParams(); // "/" üçün undefined olur

  React.useEffect(() => {
    if (!slug) return;

    const m = String(slug).match(/^(\d+)([tr])$/i);
    if (!m) return; // uyğun format deyil

    const num = Number(m[1]);
    const kind = m[2].toLowerCase(); // 't' | 'r'
    if (!Number.isInteger(num) || num <= 0) return;

    if (kind === "t") {
      localStorage.setItem(TABLE_KEY, String(num));
      localStorage.setItem(ACTIVE_CTX_KEY, "table");
      localStorage.removeItem(ROOM_KEY);
    } else if (kind === "r") {
      localStorage.setItem(ROOM_KEY, String(num));
      localStorage.setItem(ACTIVE_CTX_KEY, "room");
      localStorage.removeItem(TABLE_KEY);
    }

    // Navbar-a xəbər ver (eyni tabda dərhal yenilənsin)
    window.dispatchEvent(new Event("ctx_changed"));
  }, [slug]);

  return <HomePage1 />;
}

function MainLayout() {
  return (
    <div className="main-layout">
      {/* Route dəyişəndə yuxarı scroll */}
      <ScrollToTop />

      {/* <Navbar /> */}
      <Navbar1/>
      {/* <BasketPopUp /> */}
      <main className="main-content">
        <Routes>
          {/* Normal giriş: Home */}
          <Route path="/" element={<HomeRouteBridge />} />
          {/* 4t / 12r kimi linklər də Home göstərsin, eyni zamanda konteksti yazsın */}
          <Route path="/:slug" element={<HomeRouteBridge />} />

          {/* Rezerv marşrutları */}
          <Route path="/rezerv" element={<RezervationPage />} />
          <Route path="/rezerv/table" element={<TableRezervPage />} />
          <Route path="/rezerv/room" element={<RoomRezervPage />} />

          <Route path="/order" element={<OrderRoomPage />} />

          {/* Digər səhifələr */}
          <Route path="/product" element={<ProductPage1 />} />
          <Route path="/basket" element={<BasketPage />} />
          <Route path="/myOrder" element={<MyOrderPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
