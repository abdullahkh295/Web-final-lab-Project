import { useEffect, useState, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "../App.css";

function Home() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [selectedMapEvent, setSelectedMapEvent] = useState(null);
  const canvasRef = useRef(null);

  // Projection dimensions
  const minLat = 37.75;
  const maxLat = 37.81;
  const minLng = -122.50;
  const maxLng = -122.38;

  const projectCoords = (lat, lng) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 800;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 400;
    return { x, y };
  };

  // Particles network canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles = [];
    const particleCount = 45;

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.radius = Math.random() * 2 + 1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139, 92, 246, 0.4)";
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const drawLine = (p1, p2, dist) => {
      const alpha = (120 - dist) / 120;
      ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.2})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            drawLine(particles[i], particles[j], dist);
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Fetch events and create recommendations
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await axios.get("http://localhost:5000/events");
        setEvents(res.data);

        // Fetch User profile to get preferences (if logged in)
        let preferences = [];
        if (user) {
          const profileRes = await axios.get("http://localhost:5000/user/profile");
          preferences = profileRes.data.preferences || [];
        }

        if (preferences.length > 0) {
          const recs = res.data.filter((e) => preferences.includes(e.category));
          setRecommended(recs.length > 0 ? recs.slice(0, 3) : res.data.slice(0, 3));
        } else {
          setRecommended(res.data.slice(0, 3));
        }
      } catch (err) {
        console.error("Error loading events for homepage:", err);
      }
    };
    loadEvents();
  }, [user]);

  return (
    <div className="fade-in">
      <header className="hero-section">
        <canvas ref={canvasRef} id="hero-canvas" />
        <span className="hero-badge">Welcome to Eventify</span>
        <h1 className="hero-title">
          Discover & Book <span>Extraordinary</span> Events
        </h1>
        <p className="hero-description">
          Host gatherings, secure seats for local meetups, and manage all your schedules in one unified premium space. Safe, swift, and completely interactive.
        </p>
        <div className="hero-ctas">
          <Link to="/events" className="btn btn-primary" style={{ zIndex: 10 }}>
            Explore Events
          </Link>
          {!user && (
            <Link to="/signup" className="btn btn-secondary" style={{ zIndex: 10 }}>
              Get Started
            </Link>
          )}
        </div>
      </header>

      {/* Near You map visualization */}
      <section className="map-view-container">
        <h2 style={{ textAlign: "center", marginBottom: "8px" }}>Near You</h2>
        <p style={{ color: "var(--text-secondary)", textAlign: "center" }}>
          Interact with upcoming events mapped dynamically across the San Francisco Bay Area
        </p>

        <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
          <svg viewBox="0 0 800 400" className="map-svg-canvas">
            {/* Grid Map Background Lines */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
            <rect width="800" height="400" fill="url(#grid)" />

            {/* Stylized bay coast vector */}
            <path
              d="M 0,150 Q 150,120 300,180 T 600,80 T 800,100 L 800,400 L 0,400 Z"
              fill="rgba(139,92,246,0.02)"
              stroke="rgba(139,92,246,0.05)"
              strokeWidth="3"
            />
            
            {/* San Francisco park mock vector */}
            <rect x="180" y="220" width="160" height="60" rx="10" fill="rgba(16,185,129,0.02)" stroke="rgba(16,185,129,0.05)" strokeWidth="1.5" />
            <text x="260" y="255" fill="var(--text-muted)" fontSize="10" fontWeight="600" textAnchor="middle">GOLDEN GATE PARK</text>

            {/* Render coordinates pins */}
            {events
              .filter((e) => e.type === "In-Person" && e.lat && e.lng)
              .map((event) => {
                const { x, y } = projectCoords(event.lat, event.lng);
                // Check if pin is inside SVG canvas range
                if (x < 0 || x > 800 || y < 0 || y > 400) return null;

                const isSelected = selectedMapEvent?.id === event._id;

                return (
                  <g
                    key={event._id}
                    className="map-pin"
                    transform={`translate(${x}, ${y})`}
                    onClick={() => setSelectedMapEvent(event)}
                  >
                    <circle r="12" fill="var(--primary-glow)" className="map-pin-pulse" />
                    <circle r="6" fill={isSelected ? "var(--secondary)" : "var(--primary)"} />
                  </g>
                );
              })}
          </svg>

          {/* Floating mini details card */}
          {selectedMapEvent && (
            <div
              className="glass-card fade-in"
              style={{
                position: "absolute",
                bottom: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "90%",
                maxWidth: "340px",
                padding: "20px",
                textAlign: "left",
                zIndex: 20,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span className="event-date-badge" style={{ margin: 0 }}>
                  {selectedMapEvent.category}
                </span>
                <button
                  onClick={() => setSelectedMapEvent(null)}
                  style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "16px" }}
                >
                  ✕
                </button>
              </div>
              <h4 style={{ color: "#fff", marginBottom: "4px" }}>{selectedMapEvent.title}</h4>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "14px" }}>
                📍 {selectedMapEvent.location}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "700", color: "var(--secondary)" }}>
                  {selectedMapEvent.price === 0 ? "Free" : `$${selectedMapEvent.price}`}
                </span>
                <Link to={`/events/${selectedMapEvent._id}`} className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "12px" }}>
                  Book Seat
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* AI Recommendations Section */}
      <section style={{ margin: "60px 0" }}>
        <h2 style={{ textAlign: "center", marginBottom: "8px" }}>AI Recommendations</h2>
        <p style={{ color: "var(--text-secondary)", textAlign: "center", marginBottom: "30px" }}>
          Suggested events aligned with your preferences and search patterns
        </p>

        <div className="events-grid">
          {recommended.map((event) => (
            <div key={event._id} className="glass-card event-card">
              <span className="event-date-badge">{event.category}</span>
              <h3 className="event-card-title">{event.title}</h3>
              <p className="event-card-desc">{event.description}</p>
              <div className="event-meta-info">
                <div className="event-meta-item">
                  <span>📍</span>
                  <span>{event.location}</span>
                </div>
                <div className="event-meta-item">
                  <span>💰</span>
                  <span>{event.price === 0 ? "Free" : `$${event.price}`}</span>
                </div>
              </div>
              <Link to={`/events/${event._id}`} className="btn btn-primary" style={{ width: "100%", marginTop: "auto" }}>
                View Details
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Footer */}
      <section className="glass-card" style={{ textAlign: "center", maxWidth: "600px", margin: "80px auto 40px", padding: "40px" }}>
        <h2 style={{ marginBottom: "10px" }}>Stay in the Loop</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
          Subscribe to get notified about early-bird tickets and featured meetups in Moscone Center
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert("Subscribed successfully!");
          }}
          style={{ display: "flex", gap: "10px" }}
        >
          <input type="email" placeholder="Your Email Address" className="form-input" required />
          <button type="submit" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
            Subscribe
          </button>
        </form>
      </section>
    </div>
  );
}

export default Home;