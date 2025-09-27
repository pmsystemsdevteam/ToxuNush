import React, { useEffect, useState } from "react";
import "./AdminHotelAddPage.scss";

const ROOMS_API = "http://192.168.0.164:8000/api/hotel-room-number/";

function AdminHotelAddPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add form (yalnız number)
  const [formData, setFormData] = useState({ number: "" });
  const [errors, setErrors] = useState({});

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(null);

  // Edit modal (yalnız number)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    number: "",
  });
  const [editErrors, setEditErrors] = useState({});

  // ===== helpers =====
  const fetchJson = async (url, options) => {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
    }
    if (res.status === 204) return null;
    return res.json();
  };

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await fetchJson(`${ROOMS_API}?_ts=${Date.now()}`);
      setRooms(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert("Rooms failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  // ===== Add form =====
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validateAdd = () => {
    const errs = {};
    if (!String(formData.number).trim()) {
      errs.number = "Room number is required";
    } else if (isNaN(formData.number) || parseInt(formData.number, 10) <= 0) {
      errs.number = "Please enter a valid room number";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    if (!validateAdd()) return;

    const payload = {
      number: parseInt(formData.number, 10),
    };

    try {
      const created = await fetchJson(ROOMS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // Optimistik əlavə + dəqiq sinxron üçün yenidən GET
      setRooms((p) => [created, ...p]);
      setFormData({ number: "" });
      await loadRooms();
      // alert("Room added successfully!");
    } catch (e2) {
      console.error(e2);
      alert(e2.message || "Failed to add room");
    }
  };

  // ===== Delete =====
  const openDeleteModal = (room) => {
    setDeletingRoom(room);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletingRoom(null);
  };
  const confirmDelete = async () => {
    if (!deletingRoom?.id) return;
    try {
      await fetchJson(`${ROOMS_API}${deletingRoom.id}/`, { method: "DELETE" });
      setRooms((p) => p.filter((x) => x.id !== deletingRoom.id));
      closeDeleteModal();
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to delete room");
    }
  };

  // ===== Edit =====
  const openEditModal = (room) => {
    setEditForm({
      id: room.id,
      number: room.number,
    });
    setEditErrors({});
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditForm({ id: null, number: "" });
    setEditErrors({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
    if (editErrors[name]) setEditErrors((p) => ({ ...p, [name]: "" }));
  };

  const validateEdit = () => {
    const errs = {};
    if (!String(editForm.number).trim()) {
      errs.number = "Room number is required";
    } else if (isNaN(editForm.number) || parseInt(editForm.number, 10) <= 0) {
      errs.number = "Please enter a valid room number";
    }
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitEdit = async () => {
    if (!validateEdit()) return;
    const id = editForm.id;
    const payload = {
      number: parseInt(editForm.number, 10),
    };
    try {
      const updated = await fetchJson(`${ROOMS_API}${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // state-də yenilə
      setRooms((p) => p.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      closeEditModal();
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to edit room");
    }
  };

  return (
    <div className="admin-room-page">
      <h1>Hotel Room Numbers</h1>

      <div className="admin-container">
        {/* Add form */}
        <div className="form-section">
          <h2>Add New Room Number</h2>

          <form onSubmit={submitAdd} className="table-form">
            <div className="form-group">
              <label htmlFor="number">Room Number:</label>
              <input
                type="number"
                id="number"
                name="number"
                value={formData.number}
                onChange={handleInputChange}
                placeholder="Enter room number (e.g., 2)"
                min="1"
                className={errors.number ? "error" : ""}
              />
              {errors.number && <span className="error-text">{errors.number}</span>}
            </div>

            <button type="submit" className="submit-btn">
              Add Room
            </button>
          </form>
        </div>

        {/* List */}
        <div className="rooms-section">
          <h2>
            Existing Rooms {loading ? "(loading...)" : ""}
          </h2>

          {rooms.length === 0 ? (
            <div className="no-tables">No rooms found.</div>
          ) : (
            <div className="rooms-grid">
              {rooms
                .slice()
                .sort((a, b) => a.number - b.number)
                .map((r) => (
                  <div className="room-card" key={r.id}>
                    <div className="room-info">
                      <h3>Room #{r.number}</h3>
                      <p>
                        {r.created_at
                          ? new Date(r.created_at).toLocaleString("az-Latn-AZ")
                          : "—"}
                      </p>
                    </div>

                    <div className="action-buttons">
                      <button className="edit-btn" onClick={() => openEditModal(r)}>
                        Edit
                      </button>
                      <button className="delete-btn" onClick={() => openDeleteModal(r)}>
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
            <h3>Delete Room</h3>
            <p>
              Are you sure you want to delete <strong>Room #{deletingRoom?.number}</strong>?
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
            <h3>Edit Room (ID: {editForm.id})</h3>

            <div className="form-group">
              <label>Room Number</label>
              <input
                type="number"
                name="number"
                value={editForm.number}
                onChange={handleEditChange}
                min="1"
                className={editErrors.number ? "error" : ""}
              />
              {editErrors.number && <span className="error-text">{editErrors.number}</span>}
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

export default AdminHotelAddPage;
