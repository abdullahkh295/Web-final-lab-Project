import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";

function CheckoutModal({ event, ticketType, quantity, seatNumbers, addOns, totalPrice, onClose }) {
  const [step, setStep] = useState(1);
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  
  // Billing input states
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponSuccess, setCouponSuccess] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setCouponSuccess("");

    const code = couponCode.trim().toUpperCase();
    if (code === "DISCOUNT20") {
      setDiscountPercent(20);
      setCouponSuccess("20% Discount Applied!");
    } else if (code === "PROMO10") {
      setDiscountPercent(10);
      setCouponSuccess("10% Promo Applied!");
    } else {
      setErrorMsg("Invalid Coupon Code.");
      setDiscountPercent(0);
    }
  };

  const calculateDiscount = () => {
    return Math.round((totalPrice * (discountPercent / 100)) * 100) / 100;
  };

  const finalPrice = Math.round((totalPrice - calculateDiscount()) * 100) / 100;

  const handleNextStep = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!attendeeName || !attendeeEmail) {
        setErrorMsg("Please enter attendee name and email.");
        return;
      }
      setErrorMsg("");
      setStep(2);
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!cardNumber || !expiry || !cvv) {
      setErrorMsg("Please fill out all card payment details.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        eventId: event._id,
        ticketType,
        quantity,
        seatNumbers,
        totalPrice: finalPrice,
        addOns,
      };

      await axios.post("http://localhost:5000/book-event", payload);
      setSuccess(true);
      
      setTimeout(() => {
        onClose();
        navigate("/my-bookings");
      }, 2000);

    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Payment transaction failed. Please check details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-modal-overlay">
      <div className="glass-card checkout-modal-card">
        
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "#fff" }}>Secure Checkout</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "20px" }}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>🎉</div>
            <h3 style={{ color: "var(--success)", fontSize: "24px" }}>Order Confirmed!</h3>
            <p style={{ color: "var(--text-secondary)", marginTop: "10px" }}>
              Your ticket passes are confirmed. Redirecting to My Bookings...
            </p>
          </div>
        ) : (
          <>
            {/* Multi-step Navigation Nodes */}
            <div className="checkout-stepper">
              <div className={`checkout-step ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
                {step > 1 ? "✓" : "1"}
              </div>
              <div className={`checkout-step ${step >= 2 ? "active" : ""}`}>
                2
              </div>
            </div>

            {errorMsg && (
              <div className="custom-alert custom-alert-error" style={{ marginBottom: "20px" }}>
                <span>⚠️</span> {errorMsg}
              </div>
            )}

            {couponSuccess && (
              <div className="custom-alert custom-alert-success" style={{ marginBottom: "20px" }}>
                <span>🎟️</span> {couponSuccess}
              </div>
            )}

            {/* Step 1: Attendee Details Form */}
            {step === 1 && (
              <form onSubmit={handleNextStep}>
                <h3 style={{ marginBottom: "16px", color: "#fff" }}>Attendee Information</h3>
                
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter attendee's full name"
                    className="form-input"
                    value={attendeeName}
                    onChange={(e) => setAttendeeName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="form-input"
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "10px" }}>
                  Proceed to Payment
                </button>
              </form>
            )}

            {/* Step 2: Payment Details Form */}
            {step === 2 && (
              <form onSubmit={handleCheckoutSubmit}>
                <h3 style={{ marginBottom: "16px", color: "#fff" }}>Billing Details</h3>

                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input
                    type="text"
                    placeholder="4111 2222 3333 4444"
                    maxLength="19"
                    className="form-input"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      maxLength="5"
                      className="form-input"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVV Code</label>
                    <input
                      type="password"
                      placeholder="•••"
                      maxLength="3"
                      className="form-input"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Coupon Code Input */}
                <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: "16px", marginTop: "10px" }}>
                  <label className="form-label">Promo / Coupon Code</label>
                  <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                    <input
                      type="text"
                      placeholder="Try DISCOUNT20 or PROMO10"
                      className="form-input"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button onClick={handleApplyCoupon} className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>
                      Apply
                    </button>
                  </div>
                </div>

                {/* Order Summary Sticky Panel */}
                <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "10px", margin: "20px 0", fontSize: "14px", border: "1px solid var(--card-border)" }}>
                  <h4 style={{ color: "#fff", marginBottom: "10px" }}>Order Summary</h4>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span>{event.title} ({quantity}x {ticketType})</span>
                    <span>${totalPrice}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", marginBottom: "6px", color: "var(--success)" }}>
                      <span>Discount ({discountPercent}%)</span>
                      <span>-${calculateDiscount()}</span>
                    </div>
                  )}
                  {seatNumbers.length > 0 && (
                    <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", marginBottom: "6px", color: "var(--text-secondary)" }}>
                      <span>Assigned Seats</span>
                      <span>{seatNumbers.join(", ")}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "8px", marginTop: "8px", fontWeight: "700", color: "#fff", fontSize: "16px" }}>
                    <span>Amount Due</span>
                    <span>${finalPrice}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flexGrow: 1 }} disabled={loading}>
                    Back
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flexGrow: 2 }} disabled={loading}>
                    {loading ? "Processing..." : `Pay $${finalPrice}`}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CheckoutModal;
