import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import CheckoutModal from "../components/CheckoutModal";
import "../App.css";

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Countdown State
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Lightbox State
  const [lightboxImg, setLightboxImg] = useState(null);

  // Seat Selector State
  const [selectedSeats, setSelectedSeats] = useState([]);
  const seatGridRows = ["A", "B", "C", "D"];
  const seatGridCols = [1, 2, 3, 4, 5, 6];

  // Ticket Tiers State
  const [ticketType, setTicketType] = useState("General");
  const [quantity, setQuantity] = useState(1);

  // Add-ons State
  const [selectedAddons, setSelectedAddons] = useState([]);
  const addonList = [
    { id: "parking", label: "Reserved Parking Pass", price: 15 },
    { id: "catering", label: "Gourmet Catering Combo", price: 30 },
    { id: "merch", label: "Exclusive T-Shirt & Badge", price: 25 }
  ];

  // Q&A State
  const [newQuestion, setNewQuestion] = useState("");
  const [answerInput, setAnswerInput] = useState({});

  // Similar Events State
  const [similarEvents, setSimilarEvents] = useState([]);

  // Checkout Modal State
  const [showCheckout, setShowCheckout] = useState(false);

  // Mock seat statuses
  const [takenSeats] = useState(["A2", "B4", "C1", "D5"]);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setErrorMsg("");
        const res = await axios.get(`http://localhost:5000/events/${id}`);
        setEvent(res.data);

        // Fetch similar events
        const allRes = await axios.get("http://localhost:5000/events");
        const similar = allRes.data.filter(e => e.category === res.data.category && e._id !== res.data._id);
        setSimilarEvents(similar.slice(0, 3));
      } catch (err) {
        console.error("Error fetching event details:", err);
        setErrorMsg("Failed to retrieve event details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  // Countdown timer calculation
  useEffect(() => {
    if (!event?.date) return;
    const interval = setInterval(() => {
      const difference = +new Date(event.date) - +new Date();
      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
        return;
      }
      setCountdown({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (errorMsg || !event) {
    return (
      <div className="glass-card" style={{ textAlign: "center", marginTop: "40px" }}>
        <h2>Event Not Found</h2>
        <p style={{ color: "var(--text-secondary)", margin: "20px 0" }}>{errorMsg || "The requested event does not exist."}</p>
        <Link to="/events" className="btn btn-primary">Back to Events</Link>
      </div>
    );
  }

  // Cost calculation
  const getBasePrice = () => {
    if (ticketType === "VIP") return event.price * 1.5;
    if (ticketType === "Early Bird") return event.price * 0.85;
    return event.price;
  };

  const getAddonsPrice = () => {
    return selectedAddons.reduce((sum, addonId) => {
      const addon = addonList.find(a => a.id === addonId);
      return sum + (addon ? addon.price : 0);
    }, 0);
  };

  const totalPrice = Math.round((getBasePrice() * quantity + getAddonsPrice()) * 100) / 100;

  const handleSeatClick = (seatCode) => {
    if (takenSeats.includes(seatCode)) return;
    if (selectedSeats.includes(seatCode)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatCode));
    } else {
      if (selectedSeats.length >= quantity) {
        // Automatically drop oldest selected seat if quantity is exceeded
        setSelectedSeats([...selectedSeats.slice(1), seatCode]);
      } else {
        setSelectedSeats([...selectedSeats, seatCode]);
      }
    }
  };

  const handleAddonToggle = (addonId) => {
    if (selectedAddons.includes(addonId)) {
      setSelectedAddons(selectedAddons.filter(a => a !== addonId));
    } else {
      setSelectedAddons([...selectedAddons, addonId]);
    }
  };

  const handleSecureTicketClick = () => {
    if (!user) {
      setErrorMsg("You must be logged in to book tickets. Redirecting...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
      return;
    }
    setShowCheckout(true);
  };

  const submitQuestion = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("You must be logged in to submit a question.");
      return;
    }
    try {
      const res = await axios.post(`http://localhost:5000/events/${event._id}/qa`, {
        question: newQuestion,
        userName: user.name
      });
      setEvent({ ...event, qa: res.data.qa });
      setNewQuestion("");
      setSuccessMsg("Question posted successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const submitAnswer = async (qaId) => {
    const ansText = answerInput[qaId];
    if (!ansText) return;
    try {
      const res = await axios.post(`http://localhost:5000/events/${event._id}/qa/${qaId}/answer`, {
        answer: ansText
      });
      setEvent({ ...event, qa: res.data.qa });
      setAnswerInput({ ...answerInput, [qaId]: "" });
      setSuccessMsg("Answer submitted successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Add to calendar download simulation
  const downloadICS = () => {
    const calendarText = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${event.title}\nDESCRIPTION:${event.description}\nDTSTART:${event.date.replace(/-/g, "")}T090000Z\nLOCATION:${event.location}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([calendarText], { type: "text/calendar" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.replace(/\s+/g, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Theme category mapping
  const getThemeClass = () => {
    const cat = event.category?.toLowerCase() || "";
    if (cat.includes("tech")) return "theme-tech";
    if (cat.includes("music")) return "theme-music";
    if (cat.includes("sport")) return "theme-sports";
    if (cat.includes("art")) return "theme-arts";
    return "theme-tech";
  };

  return (
    <div className="fade-in">
      <div className={`event-detail-banner ${getThemeClass()}`}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "flex-start", gap: "20px" }}>
          <div>
            <span className="hero-badge" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
              {event.category}
            </span>
            <h1 style={{ color: "#fff", fontSize: "40px", margin: "16px 0 8px" }}>{event.title}</h1>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.8)", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <span>📍 {event.location}</span>
              <span>•</span>
              <span>🎫 Capacity: {event.capacity} ({event.capacity - event.sold} remaining)</span>
            </p>
          </div>

          <div className="detail-countdown-box">
            <div className="countdown-segment">
              <span className="countdown-val">{countdown.days}</span>
              <span className="countdown-lbl">Days</span>
            </div>
            <div className="countdown-segment">
              <span className="countdown-val">{countdown.hours}</span>
              <span className="countdown-lbl">Hrs</span>
            </div>
            <div className="countdown-segment">
              <span className="countdown-val">{countdown.minutes}</span>
              <span className="countdown-lbl">Min</span>
            </div>
            <div className="countdown-segment">
              <span className="countdown-val">{countdown.seconds}</span>
              <span className="countdown-lbl">Sec</span>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="custom-alert custom-alert-success" style={{ maxWidth: "600px", margin: "0 auto 20px" }}>
          <span>✅</span> {successMsg}
        </div>
      )}

      {/* Main Details Section */}
      <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px" }}>
        
        {/* Left column details */}
        <div>
          <div className="glass-card" style={{ textAlign: "left", marginBottom: "30px" }}>
            <h2>About Event</h2>
            <p style={{ margin: "20px 0", color: "var(--text-secondary)", lineHeight: "1.6", fontSize: "16px" }}>
              {event.description}
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "24px" }}>
              <button onClick={downloadICS} className="btn btn-secondary">
                🗓️ Add to Calendar
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Event link copied to clipboard!");
                }}
                className="btn btn-secondary"
              >
                🔗 Share Event
              </button>
            </div>
          </div>

          {/* Lightbox / Media Gallery */}
          <div className="glass-card" style={{ marginBottom: "30px" }}>
            <h2 style={{ textAlign: "left" }}>Media Gallery</h2>
            <div className="gallery-grid">
              {["tech", "music", "venue"].map((type, i) => (
                <div
                  key={i}
                  className="gallery-thumbnail"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&auto=format&fit=crop&q=60')`,
                  }}
                  onClick={() => setLightboxImg("https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80")}
                />
              ))}
            </div>
          </div>

          {/* Seat Picker Map */}
          {event.type === "In-Person" && (
            <div className="glass-card" style={{ marginBottom: "30px" }}>
              <h2 style={{ textAlign: "left", marginBottom: "8px" }}>Live Seat Selection</h2>
              <p style={{ color: "var(--text-secondary)", textAlign: "left", marginBottom: "20px" }}>
                Select exactly {quantity} seat{quantity > 1 ? "s" : ""} on the interactive venue map:
              </p>

              <div className="seat-map-container">
                <div className="stage-indicator">STAGE FRONT</div>
                
                <div className="seats-grid-layout">
                  {seatGridRows.map((row) => (
                    <div key={row} className="seat-row">
                      <span className="seat-row-label">{row}</span>
                      {seatGridCols.map((col) => {
                        const code = `${row}${col}`;
                        const isVIP = row === "A" || row === "B";
                        const isTaken = takenSeats.includes(code);
                        const isSelected = selectedSeats.includes(code);

                        return (
                          <div
                            key={col}
                            onClick={() => handleSeatClick(code)}
                            className={`seat-cell ${isVIP ? "vip" : "general"} ${isTaken ? "taken" : ""} ${isSelected ? "selected" : ""}`}
                            title={`Seat ${code} (${isVIP ? "VIP" : "General"})`}
                          >
                            {code}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-secondary)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div className="seat-cell general" style={{ width: "16px", height: "16px", cursor: "default" }} /> Available
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div className="seat-cell vip" style={{ width: "16px", height: "16px", cursor: "default" }} /> VIP Tier
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div className="seat-cell taken" style={{ width: "16px", height: "16px", cursor: "default" }} /> Reserved
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div className="seat-cell selected" style={{ width: "16px", height: "16px", cursor: "default" }} /> Selected
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pre-Event Q&A */}
          <div className="glass-card" style={{ marginBottom: "30px", textAlign: "left" }}>
            <h2>Attendee Q&A Forum</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "6px", marginBottom: "20px" }}>
              Ask the organiser public questions regarding schedules, tickets, or venue guidelines
            </p>

            <form onSubmit={submitQuestion} style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
              <input
                type="text"
                placeholder="Ask a question..."
                className="form-input"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
                Ask
              </button>
            </form>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {event.qa && event.qa.length > 0 ? (
                event.qa.map((qaItem) => (
                  <div key={qaItem._id} style={{ padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--card-border)", borderRadius: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <strong style={{ color: "var(--secondary)" }}>Q: {qaItem.question}</strong>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>by {qaItem.userName}</span>
                    </div>

                    {qaItem.answer ? (
                      <p style={{ paddingLeft: "16px", color: "var(--text-primary)", borderLeft: "2px solid var(--primary)", marginTop: "8px" }}>
                        👤 <strong style={{ color: "var(--primary)" }}>Organiser:</strong> {qaItem.answer}
                      </p>
                    ) : (
                      <div style={{ marginTop: "10px" }}>
                        <span style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>No answer yet</span>
                        {/* Organizer answer input */}
                        {user?.email === event.createdBy && (
                          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                            <input
                              type="text"
                              placeholder="Type answer..."
                              className="form-input"
                              value={answerInput[qaItem._id] || ""}
                              onChange={(e) => setAnswerInput({ ...answerInput, [qaItem._id]: e.target.value })}
                            />
                            <button onClick={() => submitAnswer(qaItem._id)} className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "13px" }}>
                              Reply
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No questions posted yet. Be the first!</p>
              )}
            </div>
          </div>
        </div>

        {/* Right side checkout configuration card */}
        <div>
          <div className="glass-card" style={{ position: "sticky", top: "100px", textAlign: "left" }}>
            <h2>Secure Tickets</h2>
            <div style={{ margin: "20px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Select Ticket Tier</label>
                <select
                  className="form-input"
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value)}
                >
                  <option value="General">General Pass (${event.price})</option>
                  <option value="VIP">VIP Ticket (+50% price)</option>
                  <option value="Early Bird">Early Bird (-15% discount)</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="form-input"
                  value={quantity}
                  onChange={(e) => {
                    const val = Math.max(1, Number(e.target.value));
                    setQuantity(val);
                    // Adjust seat selections if quantity goes down
                    if (selectedSeats.length > val) {
                      setSelectedSeats(selectedSeats.slice(0, val));
                    }
                  }}
                />
              </div>

              {/* Add-ons selection */}
              <div>
                <label className="form-label">Available Add-ons</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
                  {addonList.map((addon) => (
                    <label
                      key={addon.id}
                      style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: "10px", fontSize: "14px", color: "var(--text-secondary)", cursor: "pointer" }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAddons.includes(addon.id)}
                        onChange={() => handleAddonToggle(addon.id)}
                        style={{ accentColor: "var(--primary)" }}
                      />
                      <span>{addon.label} (+${addon.price})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: "16px", marginTop: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span>Tier Price ({quantity}x)</span>
                  <span>${getBasePrice() * quantity}</span>
                </div>
                {selectedAddons.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>
                    <span>Add-ons</span>
                    <span>${getAddonsPrice()}</span>
                  </div>
                )}
                {event.type === "In-Person" && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "14px", color: "var(--text-secondary)" }}>
                    <span>Selected Seats</span>
                    <span style={{ fontWeight: "700" }}>
                      {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None picked"}
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "20px", fontWeight: "700", color: "#fff", marginBottom: "20px" }}>
                  <span>Grand Total</span>
                  <span>${totalPrice}</span>
                </div>

                <button
                  onClick={handleSecureTicketClick}
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  disabled={event.sold >= event.capacity}
                >
                  {event.sold >= event.capacity ? "Sold Out" : "Secure Ticket"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Events Row */}
      {similarEvents.length > 0 && (
        <section style={{ marginTop: "60px", textAlign: "left" }}>
          <h2>Similar Events</h2>
          <div className="events-grid">
            {similarEvents.map((e) => (
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
        </section>
      )}

      {/* Lightbox Overlay */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, cursor: "pointer" }}
        >
          <img src={lightboxImg} alt="Lightbox View" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: "8px" }} />
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          event={event}
          ticketType={ticketType}
          quantity={quantity}
          seatNumbers={selectedSeats}
          addOns={selectedAddons}
          totalPrice={totalPrice}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}

export default EventDetail;
