import { useContext, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../App.css";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
      return "light";
    } else {
      document.documentElement.classList.remove("light");
      return "dark";
    }
  });

  const toggleTheme = () => {
    if (theme === "dark") {
      document.documentElement.classList.add("light");
      setTheme("light");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      setTheme("dark");
      localStorage.setItem("theme", "dark");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          ⚡ Eventify
        </Link>

        <div className="navbar-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} end>
            Home
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Events
          </NavLink>

          {user ? (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                Dashboard
              </NavLink>
              <NavLink to="/create-event" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                Create Event
              </NavLink>
              <NavLink to="/my-bookings" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                My Bookings
              </NavLink>
              
              <div className="nav-user">
                <span className="nav-username">Hi, {user.name}</span>
                <button onClick={toggleTheme} className="btn btn-secondary" style={{ padding: "8px 12px", fontSize: "14px" }}>
                  {theme === "dark" ? "☀️" : "🌙"}
                </button>
                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "13px" }}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                Login
              </NavLink>
              <NavLink to="/signup" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                Signup
              </NavLink>
              <button onClick={toggleTheme} className="btn btn-secondary" style={{ padding: "8px 12px", fontSize: "14px", marginLeft: "10px" }}>
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;