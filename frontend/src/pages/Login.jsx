import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/login", {
        email,
        password,
      });

      setSuccessMsg("Logged in successfully! Redirecting...");
      login(res.data.user, res.data.token);
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);

    } catch (error) {
      console.log("LOGIN ERROR:", error.response?.data);
      setErrorMsg(error.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in form-container">
      <div className="glass-card" style={{ marginTop: "40px" }}>
        <h1 className="form-title">Login</h1>
        <p className="form-subtitle">Enter your details to access your account</p>

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
            <label className="form-label">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "10px" }} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={{ marginTop: "24px", fontSize: "14px", color: "var(--text-secondary)", textAlign: "center" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "var(--primary)", fontWeight: "600" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;