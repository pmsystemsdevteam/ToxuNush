import React, { useEffect, useState } from "react";
import "./AdminTableAddPage.scss";

const TABLES_API = "http://172.20.5.167:8001/api/tables/";

function AdminTableAddPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add form
  const [formData, setFormData] = useState({ tableNum: "", chairNum: "" });
  const [errors, setErrors] = useState({});

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTable, setDeletingTable] = useState(null);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    table_num: "",
    chair_number: "",
  });
  const [editErrors, setEditErrors] = useState({});

  // ===== helpers =====
  const fetchJson = async (url, options) => {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `HTTP ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`
      );
    }
    if (res.status === 204) return null;
    return res.json();
  };

  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await fetchJson(`${TABLES_API}?_ts=${Date.now()}`);
      setTables(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert("Masalar yüklənmədi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  // ===== Add form =====
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validateAdd = () => {
    const errs = {};
    if (!String(formData.tableNum).trim()) {
      errs.tableNum = "Table number is required";
    } else if (
      isNaN(formData.tableNum) ||
      parseInt(formData.tableNum, 10) <= 0
    ) {
      errs.tableNum = "Please enter a valid table number";
    }
    if (!String(formData.chairNum).trim()) {
      errs.chairNum = "Chair number is required";
    } else if (
      isNaN(formData.chairNum) ||
      parseInt(formData.chairNum, 10) <= 0
    ) {
      errs.chairNum = "Please enter a valid number of chairs";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    if (!validateAdd()) return;

    const payload = {
      table_num: parseInt(formData.tableNum, 10),
      chair_number: parseInt(formData.chairNum, 10),
      status: "empty", // həmişə empty
    };

    try {
      const created = await fetchJson(TABLES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // Optimistik + dəqiq məlumat üçün yenidən GET
      setTables((p) => [created, ...p]);
      setFormData({ tableNum: "", chairNum: "" });
      await loadTables();
      // alert("Table added successfully!");
    } catch (e2) {
      console.error(e2);
      alert(e2.message || "Failed to add table");
    }
  };

  // ===== Delete =====
  const openDeleteModal = (tbl) => {
    setDeletingTable(tbl);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletingTable(null);
  };
  const confirmDelete = async () => {
    if (!deletingTable?.id) return;
    try {
      await fetchJson(`${TABLES_API}${deletingTable.id}/`, {
        method: "DELETE",
      });
      setTables((p) => p.filter((x) => x.id !== deletingTable.id));
      closeDeleteModal();
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to delete table");
    }
  };

  // ===== Edit =====
  const openEditModal = (tbl) => {
    setEditForm({
      id: tbl.id,
      table_num: tbl.table_num,
      chair_number: tbl.chair_number,
    });
    setEditErrors({});
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditForm({ id: null, table_num: "", chair_number: "" });
    setEditErrors({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
    if (editErrors[name]) setEditErrors((p) => ({ ...p, [name]: "" }));
  };

  const validateEdit = () => {
    const errs = {};
    if (!String(editForm.table_num).trim()) {
      errs.table_num = "Table number is required";
    } else if (
      isNaN(editForm.table_num) ||
      parseInt(editForm.table_num, 10) <= 0
    ) {
      errs.table_num = "Please enter a valid table number";
    }
    if (!String(editForm.chair_number).trim()) {
      errs.chair_number = "Chair number is required";
    } else if (
      isNaN(editForm.chair_number) ||
      parseInt(editForm.chair_number, 10) <= 0
    ) {
      errs.chair_number = "Please enter a valid number of chairs";
    }
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitEdit = async () => {
    if (!validateEdit()) return;
    const id = editForm.id;
    const payload = {
      table_num: parseInt(editForm.table_num, 10),
      chair_number: parseInt(editForm.chair_number, 10),
      // status-u dəyişmirik
    };
    try {
      const updated = await fetchJson(`${TABLES_API}${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // state-də yenilə
      setTables((p) => p.map((t) => (t.id === id ? { ...t, ...updated } : t)));
      closeEditModal();
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to edit table");
    }
  };

  return (
    <div className="admin-table-page">
      <h1>Table Management</h1>

      <div className="admin-container">
        {/* Add form */}
        <div className="form-section">
          <h2>Add New Table</h2>

          <form onSubmit={submitAdd} className="table-form">
            <div className="form-group">
              <label htmlFor="tableNum">Table Number:</label>
              <input
                type="number"
                id="tableNum"
                name="tableNum"
                value={formData.tableNum}
                onChange={handleInputChange}
                placeholder="Enter table number (e.g., 5)"
                min="1"
                className={errors.tableNum ? "error" : ""}
              />
              {errors.tableNum && (
                <span className="error-text">{errors.tableNum}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="chairNum">Number of Chairs:</label>
              <input
                type="number"
                id="chairNum"
                name="chairNum"
                value={formData.chairNum}
                onChange={handleInputChange}
                placeholder="Enter number of chairs"
                min="1"
                className={errors.chairNum ? "error" : ""}
              />
              {errors.chairNum && (
                <span className="error-text">{errors.chairNum}</span>
              )}
            </div>

            <button type="submit" className="submit-btn">
              Add Table
            </button>
          </form>
        </div>

        {/* List */}
        <div className="tables-section">
          <h2>Existing Tables {loading ? "(loading...)" : ""}</h2>

          {tables.length === 0 ? (
            <div className="no-tables">No tables found.</div>
          ) : (
            <div className="tables-grid">
              {tables
                .slice()
                .sort((a, b) => a.table_num - b.table_num)
                .map((t) => (
                  <div className="table-card" key={t.id}>
                    <div className="table-info">
                      <h3>Table #{t.table_num}</h3>
                      <p>
                        Chairs: <strong>{t.chair_number}</strong>
                      </p>
                      <p>
                        Status: <strong>{t.status}</strong>
                      </p>
                      <p>
                        {t.created_at
                          ? new Date(t.created_at).toLocaleString("az-Latn-AZ")
                          : "—"}
                      </p>
                    </div>

                    <div className="action-buttons">
                      <button
                        className="edit-btn"
                        onClick={() => openEditModal(t)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => openDeleteModal(t)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete modal */}
      {deleteModalOpen && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Table</h3>
            <p>
              Are you sure you want to delete{" "}
              <strong>Table #{deletingTable?.table_num}</strong>?
            </p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button className="delete-btn" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editModalOpen && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Table (ID: {editForm.id})</h3>

            <div className="form-group">
              <label>Table Number</label>
              <input
                type="number"
                name="table_num"
                value={editForm.table_num}
                onChange={handleEditChange}
                min="1"
                className={editErrors.table_num ? "error" : ""}
              />
              {editErrors.table_num && (
                <span className="error-text">{editErrors.table_num}</span>
              )}
            </div>

            <div className="form-group">
              <label>Number of Chairs</label>
              <input
                type="number"
                name="chair_number"
                value={editForm.chair_number}
                onChange={handleEditChange}
                min="1"
                className={editErrors.chair_number ? "error" : ""}
              />
              {editErrors.chair_number && (
                <span className="error-text">{editErrors.chair_number}</span>
              )}
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeEditModal}>
                Cancel
              </button>
              <button className="submit-btn" onClick={submitEdit}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTableAddPage;
