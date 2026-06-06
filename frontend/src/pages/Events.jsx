import { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "../App.css";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  
  // Search state & debounce
  const [searchVal, setSearchVal] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState(500);
  const [eventType, setEventType] = useState("All"); // "All", "In-Person", "Virtual"

  // User wishlist local tracking
  const [wishlist, setWishlist] = useState([]);

  // Pagination
  const [visibleCount, setVisibleCount] = useState(4);

  const [errorMsg, setErrorMsg] = useState("");

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Search Debouncer
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchVal);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Load events & user wishlist
  useEffect(() => {
    const loadData = async () => {
      try {
        const eventsRes = await axios.get("http://localhost:5000/events");
        setEvents(eventsRes.data);

        if (user) {
          const profileRes = await axios.get("http://localhost:5000/user/profile");
          setWishlist(profileRes.data.wishlist || []);
        }
      } catch (err) {
        console.error("Error loading events list data:", err);
        setErrorMsg("Failed to retrieve events catalog. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const toggleWishlist = async (e, eventId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setErrorMsg("Please log in to add events to your wishlist.");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/user/wishlist", { eventId });
      setWishlist(res.data.wishlist);
    } catch (err) {
      console.error("Error updating wishlist:", err);
    }
  };

  // Filter computation
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || e.category === selectedCategory;

    const matchesPrice = e.price <= maxPrice;

    const matchesType =
      eventType === "All" || e.type === eventType;

    return matchesSearch && matchesCategory && matchesPrice && matchesType;
  });

  const clearAllFilters = () => {
    setSelectedCategory("All");
    setMaxPrice(500);
    setEventType("All");
    setSearchVal("");
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1>Browse Events</h1>
          <p style={{ color: "var(--text-secondary)" }}>Secure seats for live meetups and virtual conferences</p>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            onClick={() => setViewMode("grid")}
            className={`btn ${viewMode === "grid" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "10px 14px" }}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`btn ${viewMode === "list" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "10px 14px" }}
          >
            List
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="custom-alert custom-alert-error" style={{ maxWidth: "600px", margin: "0 auto 20px" }}>
          <span>⚠️</span> {errorMsg}
        </div>
      )}

      {/* Discovery Toolbar */}
      <div className="discovery-toolbar">
        <input
          type="text"
          placeholder="Search by title or location..."
          className="form-input"
          style={{ maxWidth: "400px" }}
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
        />

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn-secondary filter-drawer-btn"
        >
          ⚙️ Advanced Filters
        </button>
      </div>

      {/* Advanced Filter Drawer */}
      {showFilters && (
        <div className="filter-drawer">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-input"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Tech">Tech</option>
              <option value="Music">Music</option>
              <option value="Sports">Sports</option>
              <option value="Arts">Arts</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Location Type</label>
            <select
              className="form-input"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option value="All">All Events</option>
              <option value="In-Person">In-Person</option>
              <option value="Virtual">Virtual</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Max Price: ${maxPrice}</label>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              style={{ width: "100%", cursor: "pointer", accentColor: "var(--primary)" }}
            />
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {(selectedCategory !== "All" || maxPrice < 500 || eventType !== "All" || searchTerm) && (
        <div className="active-filter-chips">
          <span style={{ fontSize: "14px", color: "var(--text-secondary)", marginRight: "8px" }}>Active Filters:</span>
          {selectedCategory !== "All" && (
            <span className="filter-chip">
              Category: {selectedCategory}
              <span className="filter-chip-remove" onClick={() => setSelectedCategory("All")}>✕</span>
            </span>
          )}
          {eventType !== "All" && (
            <span className="filter-chip">
              Type: {eventType}
              <span className="filter-chip-remove" onClick={() => setEventType("All")}>✕</span>
            </span>
          )}
          {maxPrice < 500 && (
            <span className="filter-chip">
              Max Price: ${maxPrice}
              <span className="filter-chip-remove" onClick={() => setMaxPrice(500)}>✕</span>
            </span>
          )}
          {searchTerm && (
            <span className="filter-chip">
              Keyword: "{searchTerm}"
              <span className="filter-chip-remove" onClick={() => setSearchVal("")}>✕</span>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginLeft: "10px" }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Shimmer Skeleton Loaders while fetching */}
      {loading ? (
        <div className="events-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shimmer-card">
              <div className="shimmer-element" style={{ width: "80px", height: "20px" }} />
              <div className="shimmer-element" style={{ width: "90%", height: "28px" }} />
              <div className="shimmer-element" style={{ width: "100%", height: "80px", flexGrow: 1 }} />
              <div className="shimmer-element" style={{ width: "100%", height: "40px" }} />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No Events Found</h3>
          <p>We couldn't find any events matching your search or filters. Try adjusting your parameters.</p>
        </div>
      ) : (
        <>
          <div className={viewMode === "grid" ? "events-grid" : "list-view-layout"}>
            {filteredEvents.slice(0, visibleCount).map((event) => {
              const isWished = wishlist.includes(event._id);

              return (
                <div key={event._id} className="glass-card event-card">
                  {/* Favorite toggle heart */}
                  <button
                    className={`wishlist-heart-btn ${isWished ? "active" : ""}`}
                    onClick={(e) => toggleWishlist(e, event._id)}
                  >
                    ❤️
                  </button>

                  <div className="event-date-badge">{event.category}</div>
                  <h3 className="event-card-title">{event.title}</h3>
                  <p className="event-card-desc">{event.description}</p>
                  
                  <div className="event-meta-info">
                    <div className="event-meta-item">
                      <span>📍</span>
                      <span>{event.location} ({event.type})</span>
                    </div>
                    <div className="event-meta-item">
                      <span>💰</span>
                      <span>{event.price === 0 ? "Free" : `$${event.price}`}</span>
                    </div>
                  </div>

                  <Link
                    to={`/events/${event._id}`}
                    className="btn btn-primary"
                    style={{ marginTop: "auto", width: viewMode === "grid" ? "100%" : "auto" }}
                  >
                    View Details
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Load More Pagination */}
          {visibleCount < filteredEvents.length && (
            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <button
                onClick={() => setVisibleCount((prev) => prev + 4)}
                className="btn btn-secondary"
              >
                Load More Events
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Events;
