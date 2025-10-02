import React, { useEffect, useState } from "react";
import "./AdminAddPage.scss";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PRODUCTS_URL = "http://172.20.5.167:8001/api/products/";
const CATEGORIES_URL = "http://172.20.5.167:8001/api/categories/";

function AdminAddPage() {
  const navigate = useNavigate();

  // Form state-ləri
  const [formData, setFormData] = useState({
    category: "",    // backend: id
    nameAz: "",
    nameEn: "",
    nameRu: "",
    descAz: "",
    descEn: "",
    descRu: "",
    cost: "",
    vegan: false,
    halal: false,
    image: null,     // File
    time: ""
  });

  const [imagePreview, setImagePreview] = useState(null);

  // Kateqoriyalar (backend-dən)
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // --- Kateqoriyaları yüklə ---
  const fetchCategories = async () => {
    try {
      setLoadingCats(true);
      const res = await axios.get(CATEGORIES_URL);
      const arr = Array.isArray(res.data) ? res.data : [];
      setCategories(arr);
    } catch (e) {
      console.error(e);
      setErrorMsg("Kateqoriyalar yüklənə bilmədi.");
    } finally {
      setLoadingCats(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Input dəyərlərini idarə etmək
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Şəkil seçimi və ön izləmə
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Formu göndərmək (POST /products/)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      setSubmitLoading(true);

      const fd = new FormData();
      fd.append("category", String(formData.category)); // id
      fd.append("name_az", formData.nameAz);
      fd.append("name_en", formData.nameEn);
      fd.append("name_ru", formData.nameRu);
      fd.append("description_az", formData.descAz);
      fd.append("description_en", formData.descEn);
      fd.append("description_ru", formData.descRu);
      fd.append("cost", String(formData.cost));         // decimal/string
      fd.append("time", String(formData.time));         // int
      fd.append("vegan", formData.vegan ? "true" : "false");
      fd.append("halal", formData.halal ? "true" : "false");

      if (formData.image instanceof File) {
        fd.append("image", formData.image);
      }

      await axios.post(PRODUCTS_URL, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Məhsul uğurla əlavə edildi!");
      navigate("/admin/product"); // siyahıya geri
    } catch (e) {
      console.error(e);
      const detail =
        e?.response?.data
          ? `Xəta: ${JSON.stringify(e.response.data)}`
          : e?.message || "Naməlum xəta.";
      setErrorMsg(detail);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Kateqoriya adını göstərmək üçün təhlükəsiz fallback
  const catLabel = (c) => c.name_az || c.name || c.title || `Kateqoriya #${c.id}`;

  return (
    <div className="admin-add-page1">
      <div className="admin-container1">
        <h1 className="admin-title">Yeni Məhsul Əlavə Et</h1>

        {errorMsg && <div className="error">{errorMsg}</div>}
        {loadingCats && <div className="loading">Kateqoriyalar yüklənir...</div>}

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h2 className="section-title">Əsas Məlumatlar</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Kateqoriya *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  disabled={loadingCats}
                >
                  <option value="">Kateqoriya seçin</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {catLabel(cat)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="cost">Qiymət (AZN) *</label>
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="time">Hazırlanma Müddəti (dəq) *</label>
                <input
                  type="number"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="15"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">Ad Məlumatları</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nameAz">Ad (Azərbaycan) *</label>
                <input
                  type="text"
                  id="nameAz"
                  name="nameAz"
                  value={formData.nameAz}
                  onChange={handleInputChange}
                  placeholder="Məhsulun azərbaycan dilində adı"
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
                  placeholder="Product name in English"
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
                  placeholder="Название продукта на русском"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">Təsvir Məlumatları</h2>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="descAz">Təsvir (Azərbaycan) *</label>
                <textarea
                  id="descAz"
                  name="descAz"
                  value={formData.descAz}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Məhsulun azərbaycan dilində təsviri"
                  required
                ></textarea>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="descEn">Təsvir (English) *</label>
                <textarea
                  id="descEn"
                  name="descEn"
                  value={formData.descEn}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Product description in English"
                  required
                ></textarea>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="descRu">Təsvir (Русский) *</label>
                <textarea
                  id="descRu"
                  name="descRu"
                  value={formData.descRu}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Описание продукта на русском"
                  required
                ></textarea>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">Digər Məlumatlar</h2>

            <div className="form-row">
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

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="image">Məhsul Şəkli *</label>
                <div className="image-upload">
                  <input
                    type="file"
                    id="image"
                    name="image"
                    onChange={handleImageChange}
                    accept="image/*"
                    required
                  />
                  <label htmlFor="image" className="image-upload-label">
                    <i className="fas fa-upload"></i>
                    Şəkil Seçin
                  </label>

                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Ön baxış" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={submitLoading || loadingCats}>
              {submitLoading ? "Göndərilir..." : "Məhsulu Əlavə Et"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminAddPage;
