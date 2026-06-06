require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Models
const User = require("./models/User");
const Event = require("./models/Event");
const Booking = require("./models/Booking");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/eventbookingdb";
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

// ==========================
// MIDDLEWARE
// ==========================
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());

// JWT Verification Middleware
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// ==========================
// SEED INITIAL EVENTS
// ==========================
const seedEvents = async () => {
  try {
    const count = await Event.countDocuments();
    if (count === 0) {
      console.log("Seeding initial events data...");
      const dummyEvents = [
        {
          title: "Silicon Valley Tech Summit 2026",
          description: "The ultimate tech gathering featuring sessions on AI, quantum computing, and agentic workflows.",
          date: "2026-10-15",
          location: "Moscone Center, San Francisco",
          createdBy: "organizer@eventify.com",
          category: "Tech",
          price: 299,
          capacity: 250,
          sold: 0,
          image: "tech",
          type: "In-Person",
          lat: 37.7842,
          lng: -122.4015
        },
        {
          title: "Rock & Jazz Midnight Festival",
          description: "A beautiful outdoor evening concert showing off international jazz and rock bands under the stars.",
          date: "2026-08-20",
          location: "Golden Gate Park, San Francisco",
          createdBy: "organizer@eventify.com",
          category: "Music",
          price: 89,
          capacity: 500,
          sold: 0,
          image: "music",
          type: "In-Person",
          lat: 37.7694,
          lng: -122.4862
        },
        {
          title: "Global Marathon & Athletics League",
          description: "Join professional and amateur athletes for the annual bay run. Prizes for top finishers.",
          date: "2026-09-05",
          location: "Embarcadero, San Francisco",
          createdBy: "sports@athletics.com",
          category: "Sports",
          price: 45,
          capacity: 1000,
          sold: 0,
          image: "sports",
          type: "In-Person",
          lat: 37.7993,
          lng: -122.3976
        },
        {
          title: "Abstract Art & NFT Light Exhibition",
          description: "A modern visual exhibition pairing classical oil canvas abstract creations with Web3 holographic NFT elements.",
          date: "2026-11-12",
          location: "De Young Museum, San Francisco",
          createdBy: "arts@deyoung.org",
          category: "Arts",
          price: 35,
          capacity: 150,
          sold: 0,
          image: "arts",
          type: "In-Person",
          lat: 37.7715,
          lng: -122.4687
        },
        {
          title: "Global Developers Virtual Workshop",
          description: "An online interactive boot camp teaching advanced full-stack development, server scaling, and next-gen UI animations.",
          date: "2026-07-28",
          location: "Zoom Webinars",
          createdBy: "tech@webacademy.com",
          category: "Tech",
          price: 0,
          capacity: 2000,
          sold: 0,
          image: "virtual",
          type: "Virtual",
          lat: 37.7749,
          lng: -122.4194
        }
      ];
      await Event.insertMany(dummyEvents);
      console.log("Seeding completed successfully.");
    }
  } catch (err) {
    console.error("Error seeding initial events:", err);
  }
};

// ==========================
// DATABASE CONNECTION
// ==========================
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected");
    seedEvents();
  })
  .catch(err => console.log(err));

// ==========================
// HOME ROUTE
// ==========================
app.get("/", (req, res) => {
  res.send("Backend Running");
});

// ==========================
// SIGNUP
// ==========================
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();
    res.json({ message: "User saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// LOGIN
// ==========================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        wishlist: user.wishlist || [],
        preferences: user.preferences || []
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// USER PROFILE ROUTES
// ==========================
app.get("/user/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/user/profile", authMiddleware, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (preferences) user.preferences = preferences;

    await user.save();
    res.json({ message: "Profile updated successfully", user: { id: user._id, name: user.name, email: user.email, wishlist: user.wishlist, preferences: user.preferences } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// WISHLIST TOGGLE
// ==========================
app.post("/user/wishlist", authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ error: "Event ID is required" });

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const idx = user.wishlist.indexOf(eventId);
    let action = "";
    if (idx > -1) {
      user.wishlist.splice(idx, 1);
      action = "removed";
    } else {
      user.wishlist.push(eventId);
      action = "added";
    }
    await user.save();
    res.json({ message: `Successfully ${action} wishlist`, wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// CREATE EVENT
// ==========================
app.post("/events", authMiddleware, async (req, res) => {
  try {
    const { title, description, date, location, category, price, capacity, type, lat, lng } = req.body;
    const createdBy = req.user.email;

    if (!title || !date || !location) {
      return res.status(400).json({ error: "Title, date and location are required" });
    }

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      createdBy,
      category: category || "General",
      price: Number(price) || 0,
      capacity: Number(capacity) || 100,
      type: type || "In-Person",
      lat: Number(lat) || 37.7749,
      lng: Number(lng) || -122.4194
    });

    await newEvent.save();
    res.json({ message: "Event created successfully", event: newEvent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// GET EVENTS
// ==========================
app.get("/events", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// GET SINGLE EVENT
// ==========================
app.get("/events/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// POST QUESTIONS (Q&A)
// ==========================
app.post("/events/:id/qa", authMiddleware, async (req, res) => {
  try {
    const { question, userName } = req.body;
    if (!question) return res.status(400).json({ error: "Question content is required" });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    event.qa.push({
      question,
      userEmail: req.user.email,
      userName: userName || req.user.email,
      answer: ""
    });

    await event.save();
    res.json({ message: "Question posted successfully", qa: event.qa });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// ANSWER QUESTIONS (Q&A)
// ==========================
app.post("/events/:id/qa/:qaId/answer", authMiddleware, async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer) return res.status(400).json({ error: "Answer content is required" });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (event.createdBy !== req.user.email) {
      return res.status(403).json({ error: "Only the event host can answer questions" });
    }

    const qItem = event.qa.id(req.params.qaId);
    if (!qItem) return res.status(404).json({ error: "Question not found" });

    qItem.answer = answer;
    await event.save();
    res.json({ message: "Question answered successfully", qa: event.qa });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// JOIN WAITLIST
// ==========================
app.post("/events/:id/waitlist", authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (event.waitlist.includes(req.user.email)) {
      return res.status(400).json({ error: "You are already on the waitlist for this event." });
    }

    event.waitlist.push(req.user.email);
    await event.save();
    res.json({ message: "Joined waitlist successfully!", waitlist: event.waitlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// BOOK EVENT
// ==========================
app.post("/book-event", authMiddleware, async (req, res) => {
  try {
    const { eventId, ticketType, quantity, seatNumbers, totalPrice, addOns } = req.body;
    const userEmail = req.user.email;

    if (!eventId) {
      return res.status(400).json({ error: "Missing event ID" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const numTickets = Number(quantity) || 1;
    if (event.sold + numTickets > event.capacity) {
      return res.status(400).json({ error: "Event has sold out or capacity limit exceeded!" });
    }

    const booking = new Booking({
      eventId,
      userEmail,
      eventTitle: event.title,
      date: event.date,
      ticketType: ticketType || "General",
      quantity: numTickets,
      seatNumbers: seatNumbers || [],
      totalPrice: totalPrice || (event.price * numTickets),
      addOns: addOns || [],
      checkedIn: false
    });

    await booking.save();

    event.sold += numTickets;
    await event.save();

    res.json({ message: "Event booked successfully", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// GET USER BOOKINGS
// ==========================
app.get("/my-bookings/:email", authMiddleware, async (req, res) => {
  try {
    if (req.user.email !== req.params.email) {
      return res.status(403).json({ message: "Access denied: Unauthorized access to other user's bookings" });
    }

    const bookings = await Booking.find({
      userEmail: req.params.email
    });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// ORGANISER DASHBOARD STATS
// ==========================
app.get("/organiser/stats", authMiddleware, async (req, res) => {
  try {
    const hostEvents = await Event.find({ createdBy: req.user.email });
    const hostEventIds = hostEvents.map(e => e._id.toString());

    const bookings = await Booking.find({ eventId: { $in: hostEventIds } });

    let totalTicketsSold = 0;
    let totalRevenue = 0;
    let checkInsCount = 0;

    bookings.forEach(b => {
      totalTicketsSold += b.quantity;
      totalRevenue += b.totalPrice;
      if (b.checkedIn) checkInsCount++;
    });

    const salesTrend = [
      { month: "Jan", sales: Math.round(totalRevenue * 0.1) },
      { month: "Feb", sales: Math.round(totalRevenue * 0.25) },
      { month: "Mar", sales: Math.round(totalRevenue * 0.5) },
      { month: "Apr", sales: Math.round(totalRevenue * 0.8) },
      { month: "May", sales: totalRevenue }
    ];

    res.json({
      eventsCount: hostEvents.length,
      ticketsSold: totalTicketsSold,
      revenue: totalRevenue,
      checkedIn: checkInsCount,
      eventsList: hostEvents.map(e => ({
        id: e._id,
        title: e.title,
        sold: e.sold,
        capacity: e.capacity,
        price: e.price,
        category: e.category
      })),
      bookingsList: bookings.map(b => ({
        id: b._id,
        eventTitle: b.eventTitle,
        userEmail: b.userEmail,
        ticketType: b.ticketType,
        quantity: b.quantity,
        totalPrice: b.totalPrice,
        checkedIn: b.checkedIn
      })),
      salesTrend
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// SCAN CHECK-IN ATTENDEE
// ==========================
app.post("/bookings/:id/check-in", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Ticket booking record not found" });

    const event = await Event.findById(booking.eventId);
    if (!event) return res.status(404).json({ error: "Associated event not found" });

    if (event.createdBy !== req.user.email) {
      return res.status(403).json({ error: "Access denied: Only event host can perform attendee check-in" });
    }

    if (booking.checkedIn) {
      return res.status(400).json({ error: "Ticket pass is already checked in!" });
    }

    booking.checkedIn = true;
    await booking.save();

    res.json({ message: "Attendee checked in successfully!", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// START SERVER
// ==========================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});