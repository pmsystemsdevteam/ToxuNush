import React, { useEffect, useState } from "react";
import "./ProductPage1.scss";
import axios from "axios";

import Left from "../../Image/MenuLeft.png";
import Right from "../../Image/MenuRight.png";
import { IoIosArrowRoundForward } from "react-icons/io";

const API_BASE = "http://172.20.5.167:8001/api";

function ProductPage1() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8); // 🔹 ilk 8 göstər

  // 🔹 API-dən məlumat çəkmək
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          axios.get(`${API_BASE}/categories/`),
          axios.get(`${API_BASE}/products/`),
        ]);
        setCategories([{ id: "all", name_az: "Hamısı" }, ...catRes.data]);
        setProducts(prodRes.data);
      } catch (err) {
        console.error("API error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🔹 Filter olunmuş məhsullar
  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  // 🔹 Yüklənən məhsullar (ilk 8, sonra +8)
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  if (loading) {
    return <div className="loading">Yüklənir...</div>;
  }

  return (
    <div className="productPage1">
      <img src={Left} className="left" alt="left-decor" />
      <img src={Right} className="right" alt="right-decor" />

      <div className="product-page">
        <h2 className="title">Məhsullarımız</h2>
        <p className="subtitle">Ənənəvi ləzzətlərimizlə tanış olun</p>

        {/* 🔹 Kategoriyalar */}
        <div className="categories">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`category-btn ${
                selectedCategory === cat.id ? "active" : ""
              }`}
              onClick={() => {
                setSelectedCategory(cat.id);
                setVisibleCount(8); // 🔹 yeni kategoriya seçiləndə resetlənir
              }}
            >
              {cat.name_az}
            </div>
          ))}
        </div>

        {/* 🔹 Məhsullar */}
        <div className="products">
          {visibleProducts.map((item) => (
            <div className="product-card" key={item.id}>
              <img src={item.image} alt={item.name_az} />
              <div className="info">
                <div className="text">
                  <h3>{item.name_az}</h3>
                  <p>{item.description_az}</p>
                </div>
                <span className="price">{item.cost} AZN</span>
              </div>
              <button
                className="add-btn"
                onClick={() => {
                  const basket =
                    JSON.parse(localStorage.getItem("my_basket")) || [];

                  // Əgər məhsul artıq varsa, təkrar əlavə etmə
                  if (!basket.includes(item.id)) {
                    basket.push(item.id);
                    localStorage.setItem("my_basket", JSON.stringify(basket));
                    alert(`${item.name_az} səbətə əlavə olundu ✅`);
                  } else {
                    alert(`${item.name_az} artıq səbətdə var`);
                  }
                }}
              >
                Səbətə əlavə et
                <div className="icon">
                  <IoIosArrowRoundForward />
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* 🔹 Daha çox */}
        {visibleCount < filteredProducts.length && (
          <div
            className="more"
            onClick={() => setVisibleCount((prev) => prev + 8)}
          >
            Daha çox
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductPage1;
