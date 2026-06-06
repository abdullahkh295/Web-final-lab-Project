import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "../App.css";

function MyBookings() {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/my-bookings/${user.email}`
        );
        setBookings(res.data);
      } catch (error) {
        console.error(error);
        setErrorMsg("Failed to load your bookings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchBookings();
    }
  }, [user]);

  return (
    <div className="fade-in" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "10px" }}>My Bookings</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "30px" }}>
        Below are all your confirmed reservations and access credentials
      </p>

      {errorMsg && (
        <div className="custom-alert custom-alert-error">
          <span>⚠️</span> {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">🎟️</div>
          <h3>No Confirmed Bookings</h3>
          <p>You haven't booked any event passes yet. Browse our global events catalogue to secure entry.</p>
        </div>
      ) : (
        <div className="bookings-grid">
          {bookings.map((b) => (
            <div key={b._id} className="glass-card booking-row">
              <div className="booking-info">
                <h3 className="booking-title">{b.eventTitle}</h3>
                <p className="booking-date">📅 Confirmed for: {b.date}</p>
              </div>
              <span className="hero-badge" style={{ margin: 0, background: "var(--success-bg)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "var(--success)" }}>
                Active Pass
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyBookings;