import React, { useEffect, useState } from "react";
import "./AdminCatagoryAddPage.scss";
import axios from "axios";
import { baseUrl } from "../../../baseUrl";
import { Link } from "react-router-dom";

const API_URL = `${baseUrl}/api/categories/`;
const ITEMS_PER_PAGE = 3;

function AdminCatagoryAddPage() {
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // --- GET /categories ---
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(API_URL);
      const arr = Array.isArray(res.data) ? res.data : [];
      setCategories(arr);
      const total = Math.ceil(arr.length / ITEMS_PER_PAGE) || 1;
      if (currentPage > total) setCurrentPage(total);
    } catch (err) {
      setError(
        "Kateqoriyalar yüklənərkən xəta: " + (err?.message || "Naməlum")
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- DELETE /categories/{id}/ ---
  const handleDelete = async (id) => {
    try {
      setSaving(true);
      await axios.delete(`${API_URL}${id}/`);
      const next = categories.filter((c) => c.id !== id);
      setCategories(next);
      setDeleteConfirm(null);
      const totalAfter = Math.ceil(next.length / ITEMS_PER_PAGE) || 1;
      if (currentPage > totalAfter) setCurrentPage(totalAfter);
      alert("Kateqoriya uğurla silindi!");
    } catch (err) {
      setError("Kateqoriya silinərkən xəta: " + (err?.message || "Naməlum"));
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE) || 1;
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentCategories = categories.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  return (
    <div className="admin-category-page">
      <div className="container">
        <div className="page-header">
          <h1>Kateqoriya İdarəetmə</h1>

          {/* YENİ SƏHİFƏYƏ YÖNLƏNİR */}
          <div className="add-category-section">
            <Link to="add">
              <button className="add-category-btn">
                Yeni Kateqoriya Əlavə Et
              </button>
            </Link>
          </div>
        </div>

        {error && <div className="error">{error}</div>}
        {loading ? (
          <div className="loading">Yüklənir...</div>
        ) : (
          <>
            <div className="categories-table-container">
              <table className="categories-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Azərbaycan</th>
                    <th>English</th>
                    <th>Русский</th>
                    <th>Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCategories.map((category) => (
                    <tr key={category.id}>
                      <td>{category.id}</td>
                      <td>{category.name_az}</td>
                      <td>{category.name_en || "-"}</td>
                      <td>{category.name_ru || "-"}</td>
                      <td>
                        <div className="action-buttons">
                          <Link to={`edit/${category.id}`}>
                            <button className="edit-btn">Düzəlt</button>
                          </Link>
                          <button
                            className="delete-btn"
                            onClick={() => setDeleteConfirm(category)}
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {currentCategories.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{ textAlign: "center", padding: 16 }}
                      >
                        Kateqoriya tapılmadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Səhifələmə */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className={`pagination-btn ${
                    currentPage === 1 ? "disabled" : ""
                  }`}
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  &laquo; Əvvəlki
                </button>

                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (number) => (
                      <button
                        key={number}
                        className={`page-btn ${
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
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Sonrakı &raquo;
                </button>
              </div>
            )}
          </>
        )}

        {/* Silmə təsdiqi */}
        {deleteConfirm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Kateqoriyanı Sil</h3>
              </div>
              <div className="modal-body">
                <p>
                  "{deleteConfirm.name_az}" kateqoriyasını silmək istədiyinizə
                  əminsiniz?
                  <br />
                  Bu əməliyyat geri alına bilməz.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="cancel-btn"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={saving}
                >
                  Ləğv Et
                </button>
                <button
                  className="delete-confirm-btn"
                  onClick={() => handleDelete(deleteConfirm.id)}
                  disabled={saving}
                >
                  {saving ? "Silinir..." : "Sil"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCatagoryAddPage;
