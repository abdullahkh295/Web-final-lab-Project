const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  eventId: String,
  userEmail: String,
  eventTitle: String,
  date: String,
  ticketType: { type: String, default: "General" },
  quantity: { type: Number, default: 1 },
  seatNumbers: { type: [String], default: [] },
  totalPrice: { type: Number, default: 0 },
  addOns: { type: [String], default: [] },
  checkedIn: { type: Boolean, default: false }
});

module.exports = mongoose.model("Booking", bookingSchema);