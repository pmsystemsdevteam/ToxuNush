import React from "react";
import { Routes, Route, useParams } from "react-router-dom";

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

// LocalStorage açarları
const TABLE_KEY = "table";           // t gələndə yazılacaq
const ROOM_KEY = "room";             // r gələndə yazılacaq
const ACTIVE_CTX_KEY = "activeContext"; // 't' | 'r'
// (istəsən compatibility üçün köhnələri də saxlaya bilərsən)
// const TABLE_NUM_KEY = "tableNumber";
// const ROOM_NUM_KEY  = "roomNumber";

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
      // digər konteksti təmizlə
      localStorage.removeItem(ROOM_KEY);
    } else if (kind === "r") {
      localStorage.setItem(ROOM_KEY, String(num));
      localStorage.setItem(ACTIVE_CTX_KEY, "room");
      localStorage.removeItem(TABLE_KEY);
    }

    // Navbar-a xəbər ver (eyni tabda dərhal yenilənsin)
    window.dispatchEvent(new Event("ctx_changed"));
  }, [slug]);

  return <HomePage />;
}

function MainLayout() {
  return (
    <div className="main-layout">
      <Navbar />
      <BasketPopUp />
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
          <Route path="/product" element={<ProductPage />} />
          <Route path="/basket" element={<BasketPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
