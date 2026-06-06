import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import OrganiserPortal from "../components/OrganiserPortal";
import "../App.css";

function Dashboard() {
  const { user, login } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [wishlistedEvents, setWishlistedEvents] = useState([]);
  
  // Profile Form States
  const [profileName, setProfileName] = useState("");
  const [preferences, setPreferences] = useState([]);
  const categoriesList = ["Tech", "Music", "Sports", "Arts"];

  // View States
  const [activeTab, setActiveTab] = useState("bookings"); // "bookings", "wishlist", "profile", "organiser"
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Load bookings
        const bookingsRes = await axios.get(`http://localhost:5000/my-bookings/${user.email}`);
        setBookings(bookingsRes.data);

        // Load profile
        const profileRes = await axios.get("http://localhost:5000/user/profile");
        setProfileName(profileRes.data.name || "");
        setPreferences(profileRes.data.preferences || []);

        // Load wishlist events details
        const wishlistIds = profileRes.data.wishlist || [];
        const eventsRes = await axios.get("http://localhost:5000/events");
        const wished = eventsRes.data.filter(e => wishlistIds.includes(e._id));
        setWishlistedEvents(wished);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user, activeTab]);

  if (!user) return null;

  const handlePreferenceToggle = (cat) => {
    if (preferences.includes(cat)) {
      setPreferences(preferences.filter(p => p !== cat));
    } else {
      setPreferences([...preferences, cat]);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      const res = await axios.put("http://localhost:5000/user/profile", {
        name: profileName,
        preferences
      });
      // Update global context state
      login(res.data.user, localStorage.getItem("token"));
      setSuccessMsg("Profile and preferences saved successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Simulate download ticket pass PDF/PNG
  const handleDownloadTicket = (b) => {
    alert(`Downloading Ticket E-Pass for "${b.eventTitle}"...\nSeat(s): ${b.seatNumbers.length > 0 ? b.seatNumbers.join(", ") : "General"}`);
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "center", marginBottom: "30px" }}>
        <h1>Attendee Hub</h1>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`btn ${activeTab === "bookings" ? "btn-primary" : "btn-secondary"}`}
          >
            🎟️ My Tickets
          </button>
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`btn ${activeTab === "wishlist" ? "btn-primary" : "btn-secondary"}`}
          >
            ❤️ Wishlist
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`btn ${activeTab === "profile" ? "btn-primary" : "btn-secondary"}`}
          >
            👤 Preferences
          </button>
          <button
            onClick={() => setActiveTab("organiser")}
            className={`btn ${activeTab === "organiser" ? "btn-primary" : "btn-secondary"}`}
          >
            💼 Organiser Portal
          </button>
        </div>
      </div>

      {loading && activeTab !== "organiser" ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="fade-in">
          {/* Booked Tickets View */}
          {activeTab === "bookings" && (
            <div>
              <h2 style={{ textAlign: "left", marginBottom: "20px" }}>My Confirmed Ticket Passes</h2>
              {bookings.length === 0 ? (
                <div className="glass-card empty-state">
                  <div className="empty-state-icon">🎟️</div>
                  <h3>No Active Passes</h3>
                  <p>You haven't booked any event passes yet. Browse events to secure your tickets!</p>
                  <Link to="/events" className="btn btn-primary" style={{ marginTop: "20px" }}>
                    Browse Catalog
                  </Link>
                </div>
              ) : (
                <div className="bookings-grid">
                  {bookings.map((b) => (
                    <div key={b._id} className="glass-card ticket-pass-card">
                      <div className="ticket-details">
                        <span className="hero-badge" style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "var(--success)", margin: "0 0 10px" }}>
                          Confirmed • {b.ticketType} Pass
                        </span>
                        <h3 style={{ color: "#fff", fontSize: "20px", marginBottom: "6px" }}>{b.eventTitle}</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "4px" }}>
                          📅 Event Date: {b.date}
                        </p>
                        {b.seatNumbers && b.seatNumbers.length > 0 && (
                          <p style={{ color: "var(--secondary)", fontSize: "14px", fontWeight: "600", marginBottom: "14px" }}>
                            💺 Selected Seats: {b.seatNumbers.join(", ")}
                          </p>
                        )}
                        <button onClick={() => handleDownloadTicket(b)} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "13px" }}>
                          📥 Download E-Ticket
                        </button>
                      </div>

                      {/* SVG Simulated QR code */}
                      <div className="ticket-qr-container">
                        <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
                          <rect x="10" y="10" width="20" height="20" fill="#000" />
                          <rect x="70" y="10" width="20" height="20" fill="#000" />
                          <rect x="10" y="70" width="20" height="20" fill="#000" />
                          <rect x="40" y="40" width="20" height="20" fill="#000" />
                          <rect x="70" y="70" width="10" height="10" fill="#000" />
                          <rect x="70" y="80" width="10" height="10" fill="#000" />
                          <rect x="80" y="80" width="10" height="10" fill="#000" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Wishlist View */}
          {activeTab === "wishlist" && (
            <div>
              <h2 style={{ textAlign: "left", marginBottom: "20px" }}>My Saved Events</h2>
              {wishlistedEvents.length === 0 ? (
                <div className="glass-card empty-state">
                  <div className="empty-state-icon">❤️</div>
                  <h3>Wishlist is Empty</h3>
                  <p>Save events you are interested in while browsing to see them here.</p>
                </div>
              ) : (
                <div className="events-grid">
                  {wishlistedEvents.map((e) => (
                    <div key={e._id} className="glass-card event-card">
                      <span className="event-date-badge">{e.category}</span>
                      <h3 className="event-card-title">{e.title}</h3>
                      <p className="event-card-desc">{e.description}</p>
                      <Link to={`/events/${e._id}`} className="btn btn-primary" style={{ width: "100%", marginTop: "auto" }}>
                        View Details
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Preferences View */}
          {activeTab === "profile" && (
            <div className="form-container">
              <div className="glass-card" style={{ textAlign: "left" }}>
                <h2 style={{ marginBottom: "10px" }}>Edit Profile</h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
                  Adjust preferences to fine-tune your AI suggestions
                </p>

                {errorMsg && (
                  <div className="custom-alert custom-alert-error" style={{ marginBottom: "20px" }}>
                    <span>⚠️</span> {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="custom-alert custom-alert-success" style={{ marginBottom: "20px" }}>
                    <span>✅</span> {successMsg}
                  </div>
                )}

                <form onSubmit={handleProfileSubmit}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Preferred Event Categories</label>
                    <div className="pref-chip-group">
                      {categoriesList.map((cat) => {
                        const isSelected = preferences.includes(cat);
                        return (
                          <div
                            key={cat}
                            onClick={() => handlePreferenceToggle(cat)}
                            className={`pref-chip ${isSelected ? "selected" : ""}`}
                          >
                            {cat}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "10px" }} disabled={submitting}>
                    {submitting ? "Saving..." : "Save Configuration"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Organiser Dashboard Panel */}
          {activeTab === "organiser" && <OrganiserPortal />}
        </div>
      )}
    </div>
  );
}

export default Dashboard;