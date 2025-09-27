import React, { useEffect, useState } from "react";
import "./AdminRoomAddPage.scss";

const ROOMS_API = "http://192.168.0.164:8000/api/rooms/";

function AdminRoomAddPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add form
  const [formData, setFormData] = useState({ roomNum: "", roomChairNum: "" });
  const [errors, setErrors] = useState({});

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(null);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    room_num: "",
    room_chair_number: "",
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

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await fetchJson(`${ROOMS_API}?_ts=${Date.now()}`);
      setRooms(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert("Otaqlar yüklənmədi.");
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
    if (!String(formData.roomNum).trim()) {
      errs.roomNum = "Room number is required";
    } else if (isNaN(formData.roomNum) || parseInt(formData.roomNum, 10) <= 0) {
      errs.roomNum = "Please enter a valid room number";
    }
    if (!String(formData.roomChairNum).trim()) {
      errs.roomChairNum = "Chair number is required";
    } else if (
      isNaN(formData.roomChairNum) ||
      parseInt(formData.roomChairNum, 10) <= 0
    ) {
      errs.roomChairNum = "Please enter a valid number of chairs";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    if (!validateAdd()) return;

    const payload = {
      room_num: parseInt(formData.roomNum, 10),
      room_chair_number: parseInt(formData.roomChairNum, 10),
      room_status: "empty", // həmişə empty
    };

    try {
      const created = await fetchJson(ROOMS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // Optimistik + dəqiq məlumat üçün yenidən GET
      setRooms((p) => [created, ...p]);
      setFormData({ roomNum: "", roomChairNum: "" });
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
      room_num: room.room_num,
      room_chair_number: room.room_chair_number,
    });
    setEditErrors({});
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditForm({ id: null, room_num: "", room_chair_number: "" });
    setEditErrors({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
    if (editErrors[name]) setEditErrors((p) => ({ ...p, [name]: "" }));
  };

  const validateEdit = () => {
    const errs = {};
    if (!String(editForm.room_num).trim()) {
      errs.room_num = "Room number is required";
    } else if (isNaN(editForm.room_num) || parseInt(editForm.room_num, 10) <= 0) {
      errs.room_num = "Please enter a valid room number";
    }
    if (!String(editForm.room_chair_number).trim()) {
      errs.room_chair_number = "Chair number is required";
    } else if (
      isNaN(editForm.room_chair_number) ||
      parseInt(editForm.room_chair_number, 10) <= 0
    ) {
      errs.room_chair_number = "Please enter a valid number of chairs";
    }
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitEdit = async () => {
    if (!validateEdit()) return;
    const id = editForm.id;
    const payload = {
      room_num: parseInt(editForm.room_num, 10),
      room_chair_number: parseInt(editForm.room_chair_number, 10),
      // room_status-u dəyişmirik
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
      <h1>Room Management</h1>

      <div className="admin-container">
        {/* Add form */}
        <div className="form-section">
          <h2>Add New Room</h2>

          <form onSubmit={submitAdd} className="table-form">
            <div className="form-group">
              <label htmlFor="roomNum">Room Number:</label>
              <input
                type="number"
                id="roomNum"
                name="roomNum"
                value={formData.roomNum}
                onChange={handleInputChange}
                placeholder="Enter room number (e.g., 2)"
                min="1"
                className={errors.roomNum ? "error" : ""}
              />
              {errors.roomNum && (
                <span className="error-text">{errors.roomNum}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="roomChairNum">Number of Chairs:</label>
              <input
                type="number"
                id="roomChairNum"
                name="roomChairNum"
                value={formData.roomChairNum}
                onChange={handleInputChange}
                placeholder="Enter number of chairs"
                min="1"
                className={errors.roomChairNum ? "error" : ""}
              />
              {errors.roomChairNum && (
                <span className="error-text">{errors.roomChairNum}</span>
              )}
            </div>

            <button type="submit" className="submit-btn">
              Add Room
            </button>
          </form>
        </div>

        {/* List */}
        <div className="rooms-section">
          <h2>Existing Rooms {loading ? "(loading...)" : ""}</h2>

          {rooms.length === 0 ? (
            <div className="no-tables">No rooms found.</div>
          ) : (
            <div className="rooms-grid">
              {rooms
                .slice()
                .sort((a, b) => a.room_num - b.room_num)
                .map((r) => (
                  <div className="room-card" key={r.id}>
                    <div className="room-info">
                      <h3>Room #{r.room_num}</h3>
                      <p>
                        Chairs: <strong>{r.room_chair_number}</strong>
                      </p>
                      <p>
                        Status: <strong>{r.room_status}</strong>
                      </p>
                      <p>
                        {r.created_at
                          ? new Date(r.created_at).toLocaleString("az-Latn-AZ")
                          : "—"}
                      </p>
                    </div>

                    <div className="action-buttons">
                      <button
                        className="edit-btn"
                        onClick={() => openEditModal(r)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => openDeleteModal(r)}
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
            <h3>Delete Room</h3>
            <p>
              Are you sure you want to delete{" "}
              <strong>Room #{deletingRoom?.room_num}</strong>?
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
                name="room_num"
                value={editForm.room_num}
                onChange={handleEditChange}
                min="1"
                className={editErrors.room_num ? "error" : ""}
              />
              {editErrors.room_num && (
                <span className="error-text">{editErrors.room_num}</span>
              )}
            </div>

            <div className="form-group">
              <label>Number of Chairs</label>
              <input
                type="number"
                name="room_chair_number"
                value={editForm.room_chair_number}
                onChange={handleEditChange}
                min="1"
                className={editErrors.room_chair_number ? "error" : ""}
              />
              {editErrors.room_chair_number && (
                <span className="error-text">
                  {editErrors.room_chair_number}
                </span>
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

export default AdminRoomAddPage;
