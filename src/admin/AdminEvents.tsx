import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiUrl } from "../api/config";
import "./admin.css";

// Type definition for backend Event
interface AdminEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  price: number;
  capacity?: number;
  sold?: number;
  isTrending: boolean;
  isPublished: boolean;
  createdByName?: string;
}

type DeleteConfirm = { eventId: string; title: string } | null;

const AdminEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm>(null);
  const [deleting, setDeleting] = useState(false);
  const userRole = localStorage.getItem("adminRole");
  const isSuperAdmin = userRole === "superadmin";

  useEffect(() => {
    fetchEvents();
  }, []);

  const mapToAdminEvent = (e: {
    id: string;
    title: string;
    date: string;
    category?: string;
    location?: string;
    venue?: string;
    price?: number;
    capacity?: number;
    sold?: number;
    isTrending?: boolean;
    isPublished?: boolean;
    createdByName?: string;
  }): AdminEvent => ({
    id: e.id,
    title: e.title,
    category: e.category ?? "General",
    date: e.date,
    location: e.location ?? e.venue ?? "",
    price: typeof e.price === "number" ? e.price : 0,
    capacity: e.capacity,
    sold: e.sold,
    isTrending: Boolean(e.isTrending),
    isPublished: e.isPublished !== false,
    createdByName: e.createdByName,
  });

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      let list: AdminEvent[] = [];

      // Only use admin-scoped events (each admin sees only their own; superadmin sees all)
      const adminRes = await fetch(apiUrl("/api/admin/events"), { headers });
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        const raw = Array.isArray(adminData) ? adminData : adminData?.events ?? adminData?.data ?? [];
        list = raw.map((e: unknown) => mapToAdminEvent(e as Parameters<typeof mapToAdminEvent>[0]));
      }

      setEvents(list);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, title: string) => {
    setDeleteConfirm({ eventId, title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(apiUrl(`/api/events/${deleteConfirm.eventId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setEvents((prev) => prev.filter((e) => e.id !== deleteConfirm.eventId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete event. You may not have permission.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleTrending = async (
    eventId: string,
    currentStatus: boolean,
  ) => {
    const nextTrending = !currentStatus;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, isTrending: nextTrending } : e,
      ),
    );
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(apiUrl(`/api/events/${eventId}/trending`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isTrending: nextTrending }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed: ${res.status}`);
      }
    } catch (err) {
      console.error("Failed to toggle trending:", err);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, isTrending: currentStatus } : e,
        ),
      );
      alert(err instanceof Error ? err.message : "Failed to update trending. Try again.");
    }
  };

  const handleToggleVisibility = async (
    eventId: string,
    currentPublished: boolean,
  ) => {
    const nextPublished = !currentPublished;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, isPublished: nextPublished } : e,
      ),
    );
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(apiUrl(`/api/admin/events/${eventId}/visibility`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublished: nextPublished }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, isPublished: currentPublished } : e,
        ),
      );
      alert("Failed to update visibility. Try again.");
    }
  };

  if (loading) return <div className="admin-page">Loading events...</div>;

  return (
    <div className="admin-page">
      <div className="admin-events-container">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Event Management</h1>
          <Link to="/admin/events/create" className="admin-btn-create">
            + Create Event
          </Link>
        </div>

        <div className="admin-event-list admin-event-list-inside">
          {events.length === 0 ? (
            <div className="admin-empty-state">
              No events found. Create your first event!
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="admin-event-row">
                <div className="admin-event-info">
                  <h3>
                    {event.title}
                    {event.isTrending && (
                      <span
                        style={{
                          marginLeft: "8px",
                          fontSize: "0.7em",
                          background: "#f59e0b",
                          color: "white",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        Trending
                      </span>
                    )}
                  </h3>
                  <p className="admin-event-meta">
                    {event.category} •{" "}
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                  <p className="admin-event-meta">
                    {event.location || "No location"}
                  </p>
                  {event.createdByName && (
                    <p className="admin-event-creator">
                      Created by {event.createdByName}
                    </p>
                  )}
                </div>
                <span className="admin-event-price">₦{event.price}</span>
                <div className="admin-event-actions">
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleVisibility(event.id, event.isPublished)
                    }
                    className={
                      event.isPublished
                        ? "admin-btn-visibility-on"
                        : "admin-btn-visibility-off"
                    }
                    title={
                      event.isPublished
                        ? "Visible on site – click to hide"
                        : "Hidden from site – click to show"
                    }
                    style={{
                      marginRight: "8px",
                      padding: "4px 8px",
                      fontSize: "0.85rem",
                      border: "1px solid currentColor",
                      borderRadius: "4px",
                      background: event.isPublished ? "#22c55e" : "#94a3b8",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    {event.isPublished ? "Visible" : "Hidden"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleTrending(event.id, event.isTrending)
                    }
                    className={
                      event.isTrending
                        ? "admin-btn-uptrending"
                        : "admin-btn-trending"
                    }
                    title={
                      event.isTrending
                        ? "Remove from Trending"
                        : isSuperAdmin
                          ? "Add to Trending (any event)"
                          : "Add to Trending"
                    }
                    style={{ marginRight: "8px" }}
                  >
                    ★
                  </button>
                  <button
                    type="button"
                    aria-label="Edit event"
                    onClick={() => navigate(`/admin/events/edit/${event.id}`)}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    aria-label="Delete event"
                    onClick={() => handleDeleteEvent(event.id, event.title)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {deleteConfirm && (
        <div
          className="admin-modal-overlay"
          onClick={() => !deleting && setDeleteConfirm(null)}
        >
          <div
            className="admin-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Delete event</h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => !deleting && setDeleteConfirm(null)}
                disabled={deleting}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-form">
              <p className="admin-delete-confirm-message">
                Are you sure you want to delete{" "}
                <strong>"{deleteConfirm.title}"</strong>? This action cannot be
                undone.
              </p>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn-cancel"
                  onClick={() => !deleting && setDeleteConfirm(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-danger"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting…" : "Delete event"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
