// Import necessary modules
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const Connection = require("../db/Connection"); // Import your DB utility
require("dotenv").config(); // Load environment variables

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// MySQL session store setup
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: "", // Use process.env.DB_PASSWORD ideally
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  clearExpired: true,
  checkExpirationInterval: 1000 * 60 * 5,
  expiration: 1000 * 60 * 60 * 24, // 1 day
});

// Session middleware
app.use(
  session({
    name: "oscaims_sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Import route handlers
const authRoutes = require("../route/authRoutes");
const seniorCitizenRoutes = require("../route/seniorCitizenRoutes");
const auditRoutes = require("../route/auditRoutes");
const smsRoute = require("../route/smsRoute");
const templateRoutes = require("../route/templateRoutes");
const officialRoutes = require("../route/officialRoutes");
const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log("✅ Created uploads directory");
}
app.use("/uploads", express.static("uploads")); // serve uploaded images
app.use("/api/officials", officialRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/user", authRoutes);
app.use("/api/senior-citizens", seniorCitizenRoutes);
app.use("/api/sms", smsRoute);
app.use("/api/templates", templateRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong on the server!" });
});

// Session test route
app.get("/api/test-session", (req, res) => {
  req.session.views = (req.session.views || 0) + 1;
  res.send(`Session views: ${req.session.views}`);
});

// Trust proxy
app.set("trust proxy", 1);

// 🔁 Auto deactivate users with expired sessions
const deactivateExpiredUsers = async () => {
  try {
    const expiredSessions = await sessionStore.all();
    const now = Date.now();
    const expiredUserIds = [];

    for (const sid in expiredSessions) {
      const sess = expiredSessions[sid];
      if (sess.cookie?.expires && new Date(sess.cookie.expires) < now) {
        if (sess.user?.id) {
          expiredUserIds.push(sess.user.id);
        }
      }
    }

    if (expiredUserIds.length > 0) {
      const placeholders = expiredUserIds.map(() => "?").join(",");
      await Connection(
        `UPDATE users SET status = 'inactive' WHERE id IN (${placeholders})`,
        expiredUserIds
      );
      console.log(
        `🔒 Marked ${expiredUserIds.length} user(s) as inactive due to expired sessions`
      );
    }
  } catch (err) {
    console.error("❌ Error deactivating expired sessions:", err);
  }
};

// Run check every 5 minutes
setInterval(deactivateExpiredUsers, 300000); // 5 minutes

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
