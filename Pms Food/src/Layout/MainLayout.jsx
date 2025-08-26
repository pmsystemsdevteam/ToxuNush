import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./Navbar/Navbar";
import HomePage from "../Page/HomePage/HomePage";
import ProductPage from "../Page/ProductPage/ProductPage";
import BasketPage from "../Page/BasketPage/BasketPage";
import Footer from "./Footer/Footer";
import BasketPopUp from "../Page/BasketPopUp/BasketPopUp";

function MainLayout() {
  return (
    <div className="main-layout">
      <Navbar />
      <BasketPopUp/>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:id" element={<HomePage />} />
          <Route path="/product" element={<ProductPage />} />
          <Route path="/basket" element={<BasketPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
