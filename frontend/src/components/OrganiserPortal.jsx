import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../App.css";

function OrganiserPortal() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Ticket code check-in state
  const [ticketCode, setTicketCode] = useState("");
  const [checkinStatus, setCheckinStatus] = useState("");
  const [checkinError, setCheckinError] = useState("");

  const loadStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/organiser/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Error loading host stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("http://localhost:5000/organiser/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Error loading host stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleManualCheckIn = async (e) => {
    e.preventDefault();
    setCheckinStatus("");
    setCheckinError("");

    if (!ticketCode) return;

    try {
      const res = await axios.post(`http://localhost:5000/bookings/${ticketCode}/check-in`);
      setCheckinStatus(res.data.message);
      setTicketCode("");
      loadStats(); // reload stats to update checkin counters
    } catch (err) {
      console.error(err);
      setCheckinError(err.response?.data?.error || "Attendee check-in failed. Invalid ticket pass ID.");
    }
  };

  const handleMockScan = async (bookingId) => {
    setCheckinStatus("");
    setCheckinError("");
    try {
      const res = await axios.post(`http://localhost:5000/bookings/${bookingId}/check-in`);
      setCheckinStatus(res.data.message);
      loadStats();
    } catch (err) {
      console.error(err);
      setCheckinError(err.response?.data?.error || "Scan failed.");
    }
  };

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: "200px" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!stats) return <p>Could not load organiser metrics.</p>;

  // Check-in rates
  const checkinRate = stats.ticketsSold > 0 ? Math.round((stats.checkedIn / stats.ticketsSold) * 100) : 0;

  // Max value for sales charts scaling
  const maxSalesVal = Math.max(...stats.salesTrend.map(s => s.sales), 100);

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>Organiser Dashboard</h2>
        <Link to="/create-event" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "14px" }}>
          Host Another Event
        </Link>
      </div>

      <p style={{ color: "var(--text-secondary)", textAlign: "left", marginBottom: "30px" }}>
        Publish new events, review ticketing analytics, and scan attendee passes.
      </p>

      {/* KPI block row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        <div className="glass-card stat-card" style={{ padding: "20px" }}>
          <div className="stat-val" style={{ color: "var(--primary)" }}>{stats.eventsCount}</div>
          <div className="stat-label">Events Hosted</div>
        </div>

        <div className="glass-card stat-card" style={{ padding: "20px" }}>
          <div className="stat-val" style={{ color: "var(--secondary)" }}>{stats.ticketsSold}</div>
          <div className="stat-label">Tickets Sold</div>
        </div>

        <div className="glass-card stat-card" style={{ padding: "20px" }}>
          <div className="stat-val" style={{ color: "var(--success)" }}>${stats.revenue}</div>
          <div className="stat-label">Total Revenue</div>
        </div>

        <div className="glass-card stat-card" style={{ padding: "20px" }}>
          <div className="stat-val" style={{ color: "#f59e0b" }}>{checkinRate}%</div>
          <div className="stat-label">Check-in Ratio ({stats.checkedIn} verified)</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", flexWrap: "wrap" }}>
        {/* Sales visual chart container */}
        <div className="glass-card" style={{ textAlign: "left" }}>
          <h3>Sales Performance Trend</h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Monthly gross booking revenue generated from event reservations
          </p>

          <div className="stats-chart-bar-container">
            {stats.salesTrend.map((s, idx) => {
              const percentage = (s.sales / maxSalesVal) * 160; // 160px is max chart height
              return (
                <div key={idx} className="chart-bar-column">
                  <div className="chart-bar-fill" style={{ height: `${percentage}px` }}>
                    <div className="chart-bar-tooltip">${s.sales}</div>
                  </div>
                  <span className="chart-bar-label">{s.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live QR Check-in scanner simulation container */}
        <div className="glass-card" style={{ textAlign: "left" }}>
          <h3>Attendee Check-In Scan</h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Simulate a mobile camera ticket scanner or check in ticket IDs manually
          </p>

          {checkinStatus && (
            <div className="custom-alert custom-alert-success" style={{ margin: "14px 0" }}>
              <span>✅</span> {checkinStatus}
            </div>
          )}
          {checkinError && (
            <div className="custom-alert custom-alert-error" style={{ margin: "14px 0" }}>
              <span>⚠️</span> {checkinError}
            </div>
          )}

          <div className="scanner-viewport-box">
            <div className="scanner-viewfinder" />
            <div className="scanner-laser-line" />
            <div style={{ position: "absolute", bottom: "10px", width: "100%", textAlign: "center", color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
              Scanning Active...
            </div>
          </div>

          <form onSubmit={handleManualCheckIn} style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
            <input
              type="text"
              placeholder="Enter Ticket Pass ID"
              className="form-input"
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
              Check In
            </button>
          </form>
        </div>
      </div>

      {/* Ticket List and Checking table */}
      <div className="glass-card" style={{ marginTop: "30px", textAlign: "left" }}>
        <h3>Organiser Event Registry</h3>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 20px" }}>
          Comprehensive index of your hosted events, ticket metrics, and booking records
        </p>

        {stats.eventsList.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>You haven't created any events yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)", color: "var(--text-secondary)" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>Event Name</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Category</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Tickets Sold</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Unit Price</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.eventsList.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "12px", fontWeight: "600", color: "#fff" }}>
                      <Link to={`/events/${e.id}`} style={{ color: "var(--secondary)" }}>{e.title}</Link>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{e.category}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      {e.sold} / {e.capacity}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>${e.price}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: "700" }}>${e.sold * e.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h3 style={{ marginTop: "30px", marginBottom: "15px" }}>Booked Passes Check-In Shortcuts</h3>
        {stats.bookingsList.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No tickets have been booked for your events yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)", color: "var(--text-secondary)" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>Ticket ID</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Event Title</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Attendee</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Seat(s)</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Status</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>Check-In</th>
                </tr>
              </thead>
              <tbody>
                {stats.bookingsList.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>{b.id}</td>
                    <td style={{ padding: "12px", color: "#fff" }}>{b.eventTitle}</td>
                    <td style={{ padding: "12px" }}>{b.userEmail}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{b.ticketType}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <span className="hero-badge" style={{ margin: 0, padding: "2px 8px", background: b.checkedIn ? "var(--success-bg)" : "rgba(255,255,255,0.05)", border: b.checkedIn ? "1px solid rgba(16,185,129,0.2)" : "1px solid var(--card-border)", color: b.checkedIn ? "var(--success)" : "var(--text-secondary)", fontSize: "11px" }}>
                        {b.checkedIn ? "Checked In" : "Unverified"}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <button
                        onClick={() => handleMockScan(b.id)}
                        className="btn btn-secondary"
                        style={{ padding: "4px 8px", fontSize: "12px" }}
                        disabled={b.checkedIn}
                      >
                        ⚡ Scan Pass
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrganiserPortal;
