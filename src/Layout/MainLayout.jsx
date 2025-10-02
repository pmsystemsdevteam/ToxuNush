import React, { useEffect } from "react";
import { Routes, Route, useParams } from "react-router-dom";

import Navbar1 from "./Navbar/Navbar1";
import Footer from "./Footer/Footer";

import HomePage1 from "../Page/HomePage/HomePage1";
import ProductPage1 from "../Page/ProductPage/ProductPage1";
import BasketPage1 from "../Page/BasketPage/BasketPage1";
import MyOrderPage1 from "../Page/MyOrderPage/MyOrderPage1";

function HomeRouteBridge() {
  const { slug } = useParams();

  useEffect(() => {
    if (slug && /^\d+$/.test(slug)) {
      localStorage.setItem("table_num", slug);
      console.log("📌 Tabel Number saved:", slug);
    }
  }, [slug]);

  return <HomePage1 />;
}

function MainLayout() {
  return (
    <div className="main-layout">
      <Navbar1 />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomeRouteBridge />} />

          <Route path="/:slug" element={<HomeRouteBridge />} />
          <Route path="/product" element={<ProductPage1 />} />
          <Route path="/basket" element={<BasketPage1 />} />
          <Route path="/myOrder" element={<MyOrderPage1 />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default MainLayout;
