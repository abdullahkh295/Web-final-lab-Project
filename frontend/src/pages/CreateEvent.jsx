import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";

function CreateEvent() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!title || !date || !location) {
      setErrorMsg("Title, date, and location are required.");
      return;
    }

    setLoading(true);

    try {
      await axios.post("http://localhost:5000/events", {
        title,
        description,
        date,
        location,
      });

      setSuccessMsg("Event created successfully! Redirecting...");
      setTitle("");
      setDescription("");
      setDate("");
      setLocation("");

      setTimeout(() => {
        navigate("/events");
      }, 1500);

    } catch (error) {
      console.error(error);
      setErrorMsg(error.response?.data?.error || "Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in form-container create-event-form">
      <div className="glass-card" style={{ marginTop: "20px" }}>
        <h1 className="form-title">Host New Event</h1>
        <p className="form-subtitle">Fill in the details below to publish your event globally</p>

        {errorMsg && (
          <div className="custom-alert custom-alert-error">
            <span>⚠️</span> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="custom-alert custom-alert-success">
            <span>✅</span> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Event Title</label>
            <input
              type="text"
              placeholder="e.g. NextGen Web Conference"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              placeholder="Provide a brief summary of the scheduling, speaking tracks, and requirements..."
              className="form-input"
              style={{ minHeight: "100px", resize: "vertical" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Event Date</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location / Platform</label>
            <input
              type="text"
              placeholder="e.g. San Francisco Tech Center (or Online)"
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "10px" }} disabled={loading}>
            {loading ? "Publishing Event..." : "Publish Event"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateEvent;