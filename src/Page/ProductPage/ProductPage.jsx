import React, { useEffect, useState } from "react";
import "./ProductPage.scss";
import axios from "axios";
import { baseUrl } from "../../../baseUrl";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const BASKET_KEY = "basket";

// localStorage -> number[] (unikal id-lər)
const readBasketIds = () => {
  try {
    const raw = localStorage.getItem(BASKET_KEY);
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

// İstənilən köhnə formatı unikal id-lərə normallaşdır (məs: [{id,qty}] və ya [3,3,4])
const normalizeBasketToIds = (setBasket) => {
  try {
    const raw = localStorage.getItem(BASKET_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    let ids = [];
    if (parsed.length === 0) {
      ids = [];
    } else if (typeof parsed[0] === "object" && parsed[0] !== null) {
      // [{id, qty}] və ya oxşar -> id-ləri götür
      ids = [...new Set(parsed.map((x) => x.id))];
    } else {
      // [3,3,4] -> unikal id-lər
      ids = [...new Set(parsed)];
    }

    localStorage.setItem(BASKET_KEY, JSON.stringify(ids));
    setBasket(ids);
    window.dispatchEvent(new Event("basket_updated"));
  } catch {}
};

function ProductPage() {
  const navigate = useNavigate();

  // Data
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState([]);

  // UI
  const [activeCategory, setActiveCategory] = useState("Hamısı");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;

  // Basket: number[] (unikal id-lər)
  const [basket, setBasket] = useState(() => readBasketIds());

  // API
  async function fetchProducts() {
    try {
      const res = await axios.get(`${baseUrl}/api/products/`);
      setProducts(res.data);
    } catch (error) {
      console.error("Məhsullar alınarkən xəta baş verdi:", error);
    }
  }
  async function fetchCategory() {
    try {
      const res = await axios.get(`${baseUrl}/api/categories/`);
      setCategory(res.data);
      console.log("category", res.data);

    } catch (error) {
      console.error("Kateqoriyalar alınarkən xəta baş verdi:", error);
    }
  }
  useEffect(() => {
    fetchProducts();
    fetchCategory();
  }, []);

  // Köhnə səbəti (əgər varsa) unikal id-lərə çevir
  useEffect(() => {
    normalizeBasketToIds(setBasket);
  }, []);

  // Basket helpers
  const persistAndNotify = (nextIds) => {
    localStorage.setItem(BASKET_KEY, JSON.stringify(nextIds));
    window.dispatchEvent(new Event("basket_updated")); // Navbar üçün
    setBasket(nextIds);
  };

  // >>> Eyni məhsulu 2-ci dəfə klikləyəndə SAY ARTMIASIN (əgər varsa, heç nə etmir)
  const addToBasket = (product) => {
    setBasket((prev) => {
      if (prev.includes(product.id)) {
        // artıq səbətdədir → dəyişiklik YOX
        return prev;
      }
      const next = [...prev, product.id];
      persistAndNotify(next);
      return next;
    });
     toast("Səbətə əlavə edildi", {
        icon: "🧺",
        style: {
          marginTop: "70px",
          borderRadius: "12px",
          height: "48px",
          fontFamily: "Times New Roman, serif",
        },
      });
  };

  const removeFromBasket = (productId) => {
    setBasket((prev) => {
      const next = prev.filter((id) => id !== productId);
      persistAndNotify(next);
      return next;
    });
  };

  const addAndGo = (product) => {
    addToBasket(product);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Kateqoriya
  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  const filteredProducts =
    activeCategory === "Hamısı"
      ? products
      : products.filter((p) => p.category === activeCategory);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage) || 1;
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  const paginate = (n) => {
    setCurrentPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Totals (istəyə görə)
  const totalCount = basket.length; // yalnız unikal say
  const totalAmount = basket.reduce((sum, id) => {
    const p = products.find((x) => x.id === id);
    return sum + (p ? p.cost : 0);
  }, 0);

  return (
    <div className="product-page">
      <div className="container">
        <h1 className="page-title">Məhsullarımız</h1>
        <p className="page-subtitle">Ənənəvi ləzzətlərimizlə tanış olun</p>

        {/* Kateqoriya filteri */}
        <div className="category-filter">
          <button
            className={`category-btn ${
              activeCategory === "Hamısı" ? "active" : ""
            }`}
            onClick={() => handleCategoryClick("Hamısı")}
          >
            Hamısı
          </button>
          {category && category.map((item) => (
            <button
              key={item.id}
              className={`category-btn ${
                activeCategory === item.id ? "active" : ""
              }`}
              onClick={() => handleCategoryClick(item.id)}
            >
              {item.name_az}
            </button>
          ))}
        </div>

        {/* Məhsul kartları */}
        <div className="products-grid">
          {currentProducts && currentProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <img src={product.image} alt={product.name_az} />

                {/* Vegan/Halal */}
                <div className="product-tags">
                  {product.vegan && <span className="tag vegan">Vegan</span>}
                  {product.halal && <span className="tag halal">Halal</span>}
                </div>

                {/* Səbətə əlavə et */}
                <button
                  className="add-to-basket-btn"
                  onClick={() => addToBasket(product)}
                >
                  <i className="fas fa-shopping-basket"></i>
                  Səbətə əlavə et
                </button>
              </div>

              <div className="product-info">
                <h3 className="product-name">{product.name_az}</h3>
                <p className="product-description">{product.description_az}</p>
                <div className="product-price">{product.cost} AZN</div>

                {/* Əlavə et və səbətə keç */}
                <button
                  className="go-to-basket-btn"
                  onClick={() => addAndGo(product)}
                >
                  Səbətə əlavə et
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className={`pagination-btn ${
                currentPage === 1 ? "disabled" : ""
              }`}
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i>
              Əvvəlki
            </button>

            <div className="page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <button
                    key={number}
                    className={`page-number ${
                      currentPage === number ? "active" : ""
                    }`}
                    onClick={() => paginate(number)}
                  >
                    {number}
                  </button>
                )
              )}
            </div>

            <button
              className={`pagination-btn ${
                currentPage === totalPages ? "disabled" : ""
              }`}
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              Sonrakı
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}

        {/* (Opsional) alt info */}
        {/* <div className="basket-summary">
          <span>Ümumi say: {totalCount}</span>
          <span>Ümumi məbləğ: {totalAmount} AZN</span>
        </div> */}
      </div>
    </div>
  );
}

export default ProductPage;
