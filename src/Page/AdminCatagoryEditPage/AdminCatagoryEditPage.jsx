import React, { useEffect, useState } from "react";
import "./AdminCatagoryEditPage.scss";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { baseUrl } from "../../../BaseUrl";


const API_URL = `${baseUrl}/api/categories/`;

function AdminCatagoryEditPage() {
  const { id } = useParams();            // /category/edit/:id
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    name_az: "",
    name_en: "",
    name_ru: "",
  });

  // Başlıq üçün hazırkı ad (AZ)
  const [titleAz, setTitleAz] = useState("");

  // --- GET /categories/{id}/ ---
  const fetchCategory = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await axios.get(`${API_URL}${id}/`);
      const c = res.data || {};
      setForm({
        name_az: c.name_az || "",
        name_en: c.name_en || "",
        name_ru: c.name_ru || "",
      });
      setTitleAz(c.name_az || "");
    } catch (e) {
      console.error(e);
      setErrorMsg("Kateqoriya yüklənərkən xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  // --- PUT /categories/{id}/ ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!form.name_az.trim()) {
      setErrorMsg("Zəhmət olmasa, Azərbaycan dilində adı daxil edin.");
      return;
    }

    try {
      setSubmitting(true);
      await axios.put(`${API_URL}${id}/`, form, {
        headers: { "Content-Type": "application/json" },
      });
      alert("Kateqoriya uğurla yeniləndi!");
      navigate("/admin/category");
    } catch (e) {
      console.error(e);
      const detail =
        e?.response?.data
          ? `Xəta: ${JSON.stringify(e.response.data)}`
          : e?.message || "Naməlum xəta.";
      setErrorMsg(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/admin/category");

  return (
    <div className="admin-category-edit-page">
      <div className="container">
        <header className="page-header1">
          <h1>Kateqoriya Redaktə Et</h1>
          {titleAz && <p>"{titleAz}" kateqoriyasını redaktə edin</p>}
        </header>

        {errorMsg && <div className="status-message error"><span className="icon">⚠</span>{errorMsg}</div>}

        {loading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Yüklənir...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="category-edit-form">
            <div className="form-section">
              <h2>Kateqoriya Adları</h2>

              <div className="form-group">
                <label htmlFor="name_az">Ad (Azərbaycan) *</label>
                <input
                  type="text"
                  id="name_az"
                  name="name_az"
                  value={form.name_az}
                  onChange={handleInputChange}
                  placeholder="Azərbaycan dilində ad"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="name_en">Ad (English)</label>
                <input
                  type="text"
                  id="name_en"
                  name="name_en"
                  value={form.name_en}
                  onChange={handleInputChange}
                  placeholder="Name in English"
                />
              </div>

              <div className="form-group">
                <label htmlFor="name_ru">Ad (Русский)</label>
                <input
                  type="text"
                  id="name_ru"
                  name="name_ru"
                  value={form.name_ru}
                  onChange={handleInputChange}
                  placeholder="Название на русском"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={submitting}>
                {submitting ? "Yadda Saxlanılır..." : "Yadda Saxla"}
              </button>
              <button type="button" className="cancel-btn" onClick={handleCancel} disabled={submitting}>
                Ləğv Et
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminCatagoryEditPage;
