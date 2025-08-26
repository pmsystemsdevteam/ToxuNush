import React, { useEffect, useState } from "react";
import "./AdminProductPage.scss";
import { Link } from "react-router-dom";
import axios from "axios";

const PRODUCTS_URL = "https://api.albanproject.az/api/products/";
const CATEGORIES_URL = "https://api.albanproject.az/api/categories/";

function AdminProductPage() {
  const [products, setProducts] = useState([]);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    productId: null,
    productName: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Kateqoriyalar
  const [categories, setCategories] = useState([]);
  const [catMap, setCatMap] = useState({}); // id -> ad

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;

  // --- API: GET /products ---
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await axios.get(PRODUCTS_URL);
      const arr = Array.isArray(res.data) ? res.data : [];
      setProducts(arr);
      const total = Math.ceil(arr.length / productsPerPage) || 1;
      if (currentPage > total) setCurrentPage(total);
    } catch (e) {
      console.error(e);
      setErrorMsg("Məhsullar yüklənərkən xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  };

  // --- API: GET /categories ---
  const fetchCategories = async () => {
    try {
      const res = await axios.get(CATEGORIES_URL);
      const cats = Array.isArray(res.data) ? res.data : [];
      setCategories(cats);
      // id → ad xəritəsi
      const map = cats.reduce((acc, c) => {
        acc[c.id] = c.name_az || c.name || c.title || `Kateqoriya #${c.id}`;
        return acc;
      }, {});
      setCatMap(map);
    } catch (e) {
      console.error(e);
      // kateqoriya gelməsə də UI fallback ilə (#id) işləyəcək
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Delete (DELETE /products/{id}/) ---
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${PRODUCTS_URL}${id}/`);
      const next = products.filter((p) => p.id !== id);
      setProducts(next);

      const totalPagesAfter = Math.ceil(next.length / productsPerPage) || 1;
      const indexOfLastProduct = currentPage * productsPerPage;
      const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
      const currentProductsAfter = next.slice(indexOfFirstProduct, indexOfLastProduct);
      if (currentPage > 1 && currentPage > totalPagesAfter) {
        setCurrentPage(currentPage - 1);
      } else if (currentPage > 1 && currentProductsAfter.length === 0) {
        setCurrentPage(currentPage - 1);
      }
    } catch (e) {
      console.error(e);
      alert("Silinmə zamanı xəta baş verdi.");
    } finally {
      setDeleteModal({ isOpen: false, productId: null, productName: "" });
    }
  };

  const openDeleteModal = (id, name) => setDeleteModal({ isOpen: true, productId: id, productName: name });
  const closeDeleteModal = () => setDeleteModal({ isOpen: false, productId: null, productName: "" });

  // Pagination məntiqi
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage) || 1;

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  // helper
  const asPrice = (cost) => {
    const n = typeof cost === "string" ? parseFloat(cost) : Number(cost);
    return Number.isFinite(n) ? n.toFixed(2) : cost;
  };
  const catName = (id) => catMap[id] || `#${id}`;

  return (
    <div className="admin-product-page">
      <div className="container">
        <div className="page-header2">
          <h1 className="page-title">Məhsul</h1>
          <Link to={"add"} className="add-product-btn">
            <i className="fas fa-plus"></i>
            Yeni Məhsul
          </Link>
        </div>

        {loading && <div className="loading">Yüklənir...</div>}
        {errorMsg && <div className="error">{errorMsg}</div>}

        <div className="products-grid">
          {currentProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div className="card-image">
                <img src={product.image} alt={product.name_az} />
                <div className="card-badges">
                  {product.vegan && <span className="badge vegetarian">Vegan</span>}
                  {product.halal && <span className="badge halal">Halal</span>}
                </div>
              </div>

              <div className="card-content">
                <h3 className="product-name">{product.name_az}</h3>
                <div className="name-translations">
                  <span>{product.name_en}</span>
                  <span>{product.name_ru}</span>
                </div>

                <div className="product-category">
                  <i className="fas fa-tag"></i>
                  Kateqoriya: {catName(product.category)}
                </div>

                <div className="product-description">
                  <p>{product.description_az}</p>
                  <div className="description-translations">
                    <p>{product.description_en}</p>
                    <p>{product.description_ru}</p>
                  </div>
                </div>

                <div className="product-details">
                  <div className="detail-item">
                    <i className="fas fa-coins"></i>
                    <span>{asPrice(product.cost)} AZN</span>
                  </div>

                  <div className="detail-item">
                    <i className="fas fa-clock"></i>
                    <span>{product.time} dəq</span>
                  </div>
                </div>
              </div>

              <div className="card-actions">
                <Link to={`edit/${product.id}`} className="action-btn edit">
                  <i className="fas fa-edit"></i>
                  Edit
                </Link>

                <button
                  className="action-btn delete"
                  onClick={() => openDeleteModal(product.id, product.name_az)}
                >
                  <i className="fas fa-trash"></i>
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && products.length > productsPerPage && (
          <div className="pagination">
            <button
              className={`pagination-btn ${currentPage === 1 ? "disabled" : ""}`}
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i>
              Əvvəlki
            </button>

            <div className="pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <button
                  key={number}
                  className={`pagination-number ${currentPage === number ? "active" : ""}`}
                  onClick={() => paginate(number)}
                >
                  {number}
                </button>
              ))}
            </div>

            <button
              className={`pagination-btn ${currentPage === totalPages ? "disabled" : ""}`}
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              Növbəti
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>

      {deleteModal.isOpen && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <div className="modal-header">
              <h3>Məhsulu Sil</h3>
              <button className="close-btn" onClick={closeDeleteModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-content">
              <div className="warning-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>

              <p>
                "<strong>{deleteModal.productName}</strong>" adlı məhsulu silmək istədiyinizə əminsiniz? Bu əməliyyat geri alına bilməz.
              </p>
            </div>

            <div className="modal-actions">
              <button className="btn cancel" onClick={closeDeleteModal}>
                Ləğv Et
              </button>
              <button
                className="btn confirm"
                onClick={() => handleDelete(deleteModal.productId)}
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProductPage;
