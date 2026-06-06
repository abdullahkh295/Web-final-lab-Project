const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: String,
  location: String,
  createdBy: String,
  category: { type: String, default: "General" },
  price: { type: Number, default: 0 },
  capacity: { type: Number, default: 100 },
  sold: { type: Number, default: 0 },
  image: { type: String, default: "" },
  type: { type: String, default: "In-Person" },
  lat: { type: Number, default: 37.7749 },
  lng: { type: Number, default: -122.4194 },
  waitlist: { type: [String], default: [] },
  qa: [{
    question: String,
    answer: String,
    userEmail: String,
    userName: String
  }]
});

module.exports = mongoose.model("Event", eventSchema);