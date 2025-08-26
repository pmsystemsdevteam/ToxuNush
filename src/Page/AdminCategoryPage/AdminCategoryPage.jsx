import React, { useState } from "react";
import "./AdminCategoryPage.scss";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { baseUrl } from "../../../baseUrl";

const API_URL = `${baseUrl}/api/categories/`;

function AdminCategoryPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name_az: "",
    name_en: "",
    name_ru: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!form.name_az.trim()) {
      alert("Azərbaycan dilində ad daxil edilməlidir");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(API_URL, form, {
        headers: { "Content-Type": "application/json" },
      });
      alert("Kateqoriya uğurla əlavə edildi!");
      navigate("/admin/category"); // siyahıya yönləndir
    } catch (err) {
      const detail =
        err?.response?.data
          ? `Xəta: ${JSON.stringify(err.response.data)}`
          : err?.message || "Naməlum xəta.";
      setErrorMsg(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/admin/category");

  return (
    <div className="admin-category-page">
      <div className="container">
        <div className="category-form-container">
          <h2>Yeni Kateqoriya Əlavə Et</h2>

          {errorMsg && <div className="error">{errorMsg}</div>}

          <form onSubmit={handleSubmit} className="category-form">
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

            <div className="actions">
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? "Göndərilir..." : "Əlavə Et"}
              </button>
              
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminCategoryPage;
