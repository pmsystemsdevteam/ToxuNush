import React, { useEffect, useMemo, useState } from "react";
import "./AdminProductPage.scss";
import { Link } from "react-router-dom";
import axios from "axios";

const PRODUCTS_URL   = "https://api.albanproject.az/api/products/";
const CATEGORIES_URL = "https://api.albanproject.az/api/categories/";

function AdminProductPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catMap, setCatMap] = useState({}); // id -> ad

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    productId: null,
    productName: "",
  });

  // Search
  const [query, setQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;

  // ============ Helpers ============
  const asPrice = (cost) => {
    const n = typeof cost === "string" ? parseFloat(cost) : Number(cost);
    return Number.isFinite(n) ? n.toFixed(2) : cost;
  };
  const catName = (id) => catMap[id] || `#${id}`;

  const filterProducts = (list, q) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((p) => {
      const hay =
        `${p.name_az || ""} ${p.name_en || ""} ${p.name_ru || ""}`.toLowerCase();
      return hay.includes(needle);
    });
  };

  // ============ API ============
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await axios.get(PRODUCTS_URL);
      const arr = Array.isArray(res.data) ? res.data : [];
      setProducts(arr);
    } catch (e) {
      console.error(e);
      setErrorMsg("Məhsullar yüklənərkən xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(CATEGORIES_URL);
      const cats = Array.isArray(res.data) ? res.data : [];
      setCategories(cats);
      const map = cats.reduce((acc, c) => {
        acc[c.id] = c.name_az || c.name || c.title || `Kateqoriya #${c.id}`;
        return acc;
      }, {});
      setCatMap(map);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // query dəyişəndə səhifəni 1-ə qaytar
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  // Filter + Pagination
  const filtered = useMemo(() => filterProducts(products, query), [products, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / productsPerPage));
  const indexOfLast   = currentPage * productsPerPage;
  const indexOfFirst  = indexOfLast - productsPerPage;
  const currentItems  = filtered.slice(indexOfFirst, indexOfLast);

  const paginate  = (n) => setCurrentPage(n);
  const nextPage  = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage  = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // Delete
  const openDeleteModal  = (id, name) => setDeleteModal({ isOpen: true, productId: id, productName: name });
  const closeDeleteModal = () => setDeleteModal({ isOpen: false, productId: null, productName: "" });

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${PRODUCTS_URL}${id}/`);
      const next = products.filter((p) => p.id !== id);
      setProducts(next);

      // filtered siyahıya görə səhifəni düzəlt
      const filteredNext = filterProducts(next, query);
      const newTotalPages = Math.max(1, Math.ceil(filteredNext.length / productsPerPage));
      if (currentPage > newTotalPages) setCurrentPage(newTotalPages);
    } catch (e) {
      console.error(e);
      alert("Silinmə zamanı xəta baş verdi.");
    } finally {
      closeDeleteModal();
    }
  };

  return (
    <div className="admin-product-page">
      <div className="container">
        <div className="page-header2">
          <h1 className="page-title">Məhsullar</h1>

          <div className="right-tools">
            <div className="search-wrap">
              <i className="fas fa-search" />
              <input
                type="text"
                placeholder="Ada görə axtar..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <Link to={"add"} className="add-product-btn">
              <i className="fas fa-plus"></i>
              Yeni Məhsul
            </Link>
          </div>
        </div>

        {loading && <div className="loading">Yüklənir...</div>}
        {errorMsg && <div className="error">{errorMsg}</div>}

        {/* TABLE VIEW */}
        <div className="table-wrap">
          <table className="product-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Şəkil</th>
                <th>Ad</th>
                <th>Kateqoriya</th>
                <th>Qiymət</th>
                <th>Vaxt</th>
                <th>Etiketlər</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">Nəticə tapılmadı.</td>
                </tr>
              ) : currentItems.map((p, idx) => (
                <tr key={p.id}>
                  <td>{indexOfFirst + idx + 1}</td>
                  <td>
                    <div className="thumb">
                      {/* backend image link birbaşa gəldiyi üçün 1:1 göstəririk */}
                      <img src={p.image} alt={p.name_az} />
                    </div>
                  </td>
                  <td>
                    <div className="names">
                      <div className="main">{p.name_az}</div>
                      <div className="sub">{p.name_en}</div>
                      <div className="sub">{p.name_ru}</div>
                    </div>
                  </td>
                  <td>{catName(p.category)}</td>
                  <td>{asPrice(p.cost)} AZN</td>
                  <td>{p.time} dəq</td>
                  <td>
                    <div className="badges">
                      {p.vegan && <span className="badge green">Vegan</span>}
                      {p.halal && <span className="badge blue">Halal</span>}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link to={`edit/${p.id}`} className="btn edit">
                        <i className="fas fa-edit"></i> Edit
                      </Link>
                      <button className="btn delete" onClick={() => openDeleteModal(p.id, p.name_az)}>
                        <i className="fas fa-trash"></i> Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > productsPerPage && (
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

      {/* Delete modal */}
      {deleteModal.isOpen && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <div className="modal-header">
              <h3>Məhsulu Sil</h3>
              <button className="close-btn" onClick={() => setDeleteModal({ isOpen:false, productId:null, productName:"" })}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-content">
              <div className="warning-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>

              <p>
                "<strong>{deleteModal.productName}</strong>" adlı məhsulu silmək istədiyinizə əminsiniz?
                Bu əməliyyat geri alına bilməz.
              </p>
            </div>

            <div className="modal-actions">
              <button className="btn cancel" onClick={() => setDeleteModal({ isOpen:false, productId:null, productName:"" })}>
                Ləğv Et
              </button>
              <button className="btn confirm" onClick={() => handleDelete(deleteModal.productId)}>
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
