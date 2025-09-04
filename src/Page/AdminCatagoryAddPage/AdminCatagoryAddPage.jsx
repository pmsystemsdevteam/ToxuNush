import React, { useEffect, useMemo, useState } from "react";
import "./AdminCatagoryAddPage.scss";
import axios from "axios";
import { baseUrl } from "../../../BaseUrl";
import { Link } from "react-router-dom";

const API_URL = `${baseUrl}/api/categories/`;
const ITEMS_PER_PAGE = 6;

function AdminCatagoryAddPage() {
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    name: "",
  });

  // --- GET /categories ---
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(API_URL);
      const arr = Array.isArray(res.data) ? res.data : [];
      setCategories(arr);
    } catch (err) {
      setError("Kateqoriyalar yüklənərkən xəta baş verdi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Search filter
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return categories;
    return categories.filter((c) =>
      `${c.name_az || ""} ${c.name_en || ""} ${c.name_ru || ""}`
        .toLowerCase()
        .includes(needle)
    );
  }, [categories, query]);

  // query dəyişəndə səhifəni 1-ə qaytar
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const indexOfLast = currentPage * ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
  const currentRows = filtered.slice(indexOfFirst, indexOfLast);

  const go = (p) => p >= 1 && p <= totalPages && setCurrentPage(p);

  // Delete
  const openDelete = (id, name) =>
    setDeleteModal({ isOpen: true, id, name });
  const closeDelete = () =>
    setDeleteModal({ isOpen: false, id: null, name: "" });

  const handleDelete = async () => {
    try {
      setSaving(true);
      await axios.delete(`${API_URL}${deleteModal.id}/`);
      const next = categories.filter((c) => c.id !== deleteModal.id);
      setCategories(next);
      // Filtr + səhifə düzəlişi
      const nextFiltered = next.filter((c) =>
        `${c.name_az || ""} ${c.name_en || ""} ${c.name_ru || ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      );
      const pagesAfter = Math.max(
        1,
        Math.ceil(nextFiltered.length / ITEMS_PER_PAGE)
      );
      if (currentPage > pagesAfter) setCurrentPage(pagesAfter);
      closeDelete();
    } catch (e) {
      console.error(e);
      alert("Silmə zamanı xəta baş verdi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-category-page1">
      <div className="container">
        <div className="page-header2">
          <h1 className="page-title">Kateqoriyalar</h1>

          <div className="header-right">
            <div className="search">
              <i className="fas fa-search" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ada görə axtar..."
              />
            </div>
            <Link to="add" className="add-btn">
              <i className="fas fa-plus" />
              Yeni Kateqoriya
            </Link>
          </div>
        </div>

        {loading && <div className="loading">Yüklənir...</div>}
        {error && <div className="error">{error}</div>}

        {!loading && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>ID</th>
                  <th>Azərbaycan</th>
                  <th>English</th>
                  <th>Русский</th>
                  <th style={{ width: 220 }}>Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.name_az}</td>
                    <td>{c.name_en || "-"}</td>
                    <td>{c.name_ru || "-"}</td>
                    <td>
                      <div className="row-actions">
                        <Link to={`edit/${c.id}`} className="btn light">
                          <i className="fas fa-edit" />
                          Düzəlt
                        </Link>
                        <button
                          className="btn danger"
                          onClick={() => openDelete(c.id, c.name_az)}
                        >
                          <i className="fas fa-trash" />
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {currentRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      Nəticə tapılmadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > ITEMS_PER_PAGE && (
          <div className="pagination">
            <button
              className={`pagination-btn ${currentPage === 1 ? "disabled" : ""}`}
              disabled={currentPage === 1}
              onClick={() => go(currentPage - 1)}
            >
              <i className="fas fa-chevron-left" />
              Əvvəlki
            </button>

            <div className="pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`pagination-number ${
                    n === currentPage ? "active" : ""
                  }`}
                  onClick={() => go(n)}
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              className={`pagination-btn ${
                currentPage === totalPages ? "disabled" : ""
              }`}
              disabled={currentPage === totalPages}
              onClick={() => go(currentPage + 1)}
            >
              Növbəti
              <i className="fas fa-chevron-right" />
            </button>
          </div>
        )}
      </div>

      {deleteModal.isOpen && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <div className="modal-header">
              <h3>Kateqoriyanı Sil</h3>
              <button className="close-btn" onClick={closeDelete}>
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="modal-content">
              <div className="warning-icon">
                <i className="fas fa-exclamation-triangle" />
              </div>
              <p>
                "<strong>{deleteModal.name}</strong>" kateqoriyasını silmək
                istədiyinizə əminsiniz? Bu əməliyyat geri alına bilməz.
              </p>
            </div>

            <div className="modal-actions">
              <button className="btn cancel" onClick={closeDelete}>
                Ləğv Et
              </button>
              <button
                className="btn confirm"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? "Silinir..." : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCatagoryAddPage;
