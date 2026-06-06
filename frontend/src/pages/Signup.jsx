import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../App.css";

function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        if (!name || !email || !password) {
            setErrorMsg("All fields are required.");
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post(
                "http://localhost:5000/signup",
                {
                    name,
                    email,
                    password,
                }
            );

            setSuccessMsg(res.data.message + "! Redirecting to login...");
            setName("");
            setEmail("");
            setPassword("");

            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (error) {
            console.log("SIGNUP ERROR:", error.response?.data);
            setErrorMsg(error.response?.data?.error || "Signup failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in form-container">
            <div className="glass-card" style={{ marginTop: "40px" }}>
                <h1 className="form-title">Create Account</h1>
                <p className="form-subtitle">Join us to start hosting and booking events</p>

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

                <form onSubmit={handleSignup}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            className="form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

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
                        {loading ? "Signing up..." : "Sign Up"}
                    </button>
                </form>

                <p style={{ marginTop: "24px", fontSize: "14px", color: "var(--text-secondary)", textAlign: "center" }}>
                    Already have an account?{" "}
                    <Link to="/login" style={{ color: "var(--primary)", fontWeight: "600" }}>
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Signup;