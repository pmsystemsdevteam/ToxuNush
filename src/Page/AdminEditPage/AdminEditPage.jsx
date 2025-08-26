import React, { useEffect, useState } from "react";
import "./AdminEditPage.scss";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const PRODUCTS_URL = "https://api.albanproject.az/api/products/";
const CATEGORIES_URL = "https://api.albanproject.az/api/categories/";

function AdminEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [categories, setCategories] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    category: "",          // backend: number (id)
    price: "",             // backend: cost (string/decimal)
    preparationTime: "",   // backend: time (int)
    nameAz: "",
    nameEn: "",
    nameRu: "",
    descriptionAz: "",
    descriptionEn: "",
    descriptionRu: "",
    vegan: false,
    halal: false,
    image: null,           // File
    imagePreview: null     // url
  });

  // -- helper: kateqoriya adı
  const getCatName = (catId) => {
    const c = categories.find((x) => String(x.id) === String(catId));
    return c?.name_az || c?.name || c?.title || (catId ? `#${catId}` : "");
    // Backend sahə adı fərqli ola bilər deyə fallback-lar qoyuldu
  };

  // ---- Məhsul və kateqoriyaları birlikdə çək ----
  const fetchAll = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [catsRes, productRes] = await Promise.all([
        axios.get(CATEGORIES_URL),
        axios.get(`${PRODUCTS_URL}${id}/`),
      ]);

      const cats = Array.isArray(catsRes.data) ? catsRes.data : [];
      setCategories(cats);

      const p = productRes.data;
      setFormData({
        category: p?.category ?? "",
        price: p?.cost ?? "",
        preparationTime: p?.time ?? "",
        nameAz: p?.name_az ?? "",
        nameEn: p?.name_en ?? "",
        nameRu: p?.name_ru ?? "",
        descriptionAz: p?.description_az ?? "",
        descriptionEn: p?.description_en ?? "",
        descriptionRu: p?.description_ru ?? "",
        vegan: !!p?.vegan,
        halal: !!p?.halal,
        image: null,
        imagePreview: p?.image || null
      });
    } catch (e) {
      console.error(e);
      setErrorMsg("Məlumatlar yüklənərkən xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ---- Input dəyişiklikləri ----
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "checkbox") {
      setFormData((s) => ({ ...s, [name]: checked }));
    } else if (type === "file") {
      const file = files && files[0] ? files[0] : null;
      setFormData((s) => ({
        ...s,
        image: file,
        imagePreview: file ? URL.createObjectURL(file) : s.imagePreview
      }));
    } else {
      setFormData((s) => ({ ...s, [name]: value }));
    }
  };

  // ---- Submit (PATCH) ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id) return;

    try {
      setSubmitting(true);
      setErrorMsg("");

      const fd = new FormData();

      if (formData.category !== "") fd.append("category", String(formData.category)); // id
      if (formData.price !== "") fd.append("cost", String(formData.price));
      if (formData.preparationTime !== "") fd.append("time", String(formData.preparationTime));

      if (formData.nameAz !== "") fd.append("name_az", formData.nameAz);
      if (formData.nameEn !== "") fd.append("name_en", formData.nameEn);
      if (formData.nameRu !== "") fd.append("name_ru", formData.nameRu);

      if (formData.descriptionAz !== "") fd.append("description_az", formData.descriptionAz);
      if (formData.descriptionEn !== "") fd.append("description_en", formData.descriptionEn);
      if (formData.descriptionRu !== "") fd.append("description_ru", formData.descriptionRu);

      fd.append("vegan", formData.vegan ? "true" : "false");
      fd.append("halal", formData.halal ? "true" : "false");

      if (formData.image instanceof File) {
        fd.append("image", formData.image);
      }

      await axios.patch(`${PRODUCTS_URL}${id}/`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Məhsul uğurla yeniləndi!");
      navigate("/admin/product");
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

  return (
    <div className="admin-edit-page">
      <h1>Məhsul Redaktə</h1>

      {loading && <div className="loading">Yüklənir...</div>}
      {errorMsg && <div className="error">{errorMsg}</div>}

      {!loading && (
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-section">
            <h2>Əsas Məlumatlar</h2>

            {/* KATEQORİYA ADI İLƏ SELECT */}
            <div className="form-group">
              <label htmlFor="category">Kateqoriya *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Kateqoriya seçin</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_az || c.name || c.title || `Kateqoriya #${c.id}`}
                  </option>
                ))}
              </select>
              {formData.category && (
                <small className="hint">Seçilmiş: {getCatName(formData.category)}</small>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Qiymət (AZN) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="preparationTime">Hazırlanma Müddəti (dəq) *</label>
                <input
                  type="number"
                  id="preparationTime"
                  name="preparationTime"
                  value={formData.preparationTime}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Adlar</h2>

            <div className="form-group">
              <label htmlFor="nameAz">Ad (Azərbaycan) *</label>
              <input
                type="text"
                id="nameAz"
                name="nameAz"
                value={formData.nameAz}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="nameEn">Ad (English) *</label>
              <input
                type="text"
                id="nameEn"
                name="nameEn"
                value={formData.nameEn}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="nameRu">Ad (Русский) *</label>
              <input
                type="text"
                id="nameRu"
                name="nameRu"
                value={formData.nameRu}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Təsvirlər</h2>

            <div className="form-group">
              <label htmlFor="descriptionAz">Təsvir (Azərbaycan) *</label>
              <textarea
                id="descriptionAz"
                name="descriptionAz"
                value={formData.descriptionAz}
                onChange={handleInputChange}
                rows="4"
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="descriptionEn">Təsvir (English) *</label>
              <textarea
                id="descriptionEn"
                name="descriptionEn"
                value={formData.descriptionEn}
                onChange={handleInputChange}
                rows="4"
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="descriptionRu">Təsvir (Русский) *</label>
              <textarea
                id="descriptionRu"
                name="descriptionRu"
                value={formData.descriptionRu}
                onChange={handleInputChange}
                rows="4"
                required
              ></textarea>
            </div>
          </div>

          <div className="form-section">
            <h2>Xüsusiyyətlər</h2>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="vegan"
                  checked={formData.vegan}
                  onChange={handleInputChange}
                />
                <span className="checkmark"></span>
                Vegan
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="halal"
                  checked={formData.halal}
                  onChange={handleInputChange}
                />
                <span className="checkmark"></span>
                Halal
              </label>
            </div>
          </div>

          <div className="form-section">
            <h2>Şəkil</h2>

            <div className="image-upload">
              <div className="image-preview">
                {formData.imagePreview ? (
                  <img src={formData.imagePreview} alt="Preview" />
                ) : (
                  <div className="no-image">Şəkil yüklənməyib</div>
                )}
              </div>

              <label htmlFor="image-upload" className="upload-button">
                Şəkil Seç
                <input
                  type="file"
                  id="image-upload"
                  name="image"
                  accept="image/*"
                  onChange={handleInputChange}
                />
              </label>
            </div>
            <small className="hint">Yeni şəkil seçməsən, mövcud şəkil qalır.</small>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button" disabled={submitting}>
              {submitting ? "Yenilənir..." : "Yenilə"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default AdminEditPage;
