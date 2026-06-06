const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  wishlist: { type: [String], default: [] },
  preferences: { type: [String], default: [] }
});

module.exports = mongoose.model("User", userSchema);