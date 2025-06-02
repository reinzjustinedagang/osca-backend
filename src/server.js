// Import necessary modules
const express = require("express"); // Express.js for building the web application
const cors = require("cors"); // CORS middleware for enabling cross-origin requests
const compression = require("compression"); // Compression middleware for Gzip compression
const session = require("express-session"); // Session middleware for managing user sessions
const MySQLStore = require("express-mysql-session")(session); // MySQL session store for persistent sessions

// Load environment variables from a .env file into process.env
require("dotenv").config();

// Initialize the Express application
const app = express();
// Define the port for the server, defaulting to 3000 if not specified in environment variables
const PORT = process.env.PORT || 3000;

// Middleware for Gzip compression of responses
app.use(compression());
// Middleware to parse JSON request bodies
app.use(express.json());
// Middleware to parse URL-encoded request bodies, with extended option for rich objects and arrays
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Use environment variable for flexibility
    credentials: true, // ✅ Required to allow cookies/sessions to be sent with cross-origin requests
  })
);

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST, // Database host
  user: process.env.DB_USER, // Database user
  // IMPORTANT: For production, ensure DB_PASSWORD is set in your .env file
  // and is not an empty string. This is a critical security vulnerability.
  password: "", // Use environment variable for password
  port: process.env.DB_PORT, // Database port (explicitly include for clarity)
  database: process.env.DB_DATABASE, // Database name
  clearExpired: true, // Clear expired sessions from the database
  checkExpirationInterval: 900000, // How frequently to check for expired sessions (15 minutes)
  expiration: 86400000, // The maximum age of a session in milliseconds (1 day)
});

app.use(
  session({
    name: "oscaims_sid",
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: false,
    store: sessionStore, // ✅ ADD THIS LINE
    cookie: {
      httpOnly: true,
      secure: false, // ✅ Make true only in production (with HTTPS)
      sameSite: "lax", // ✅ Adjust as needed
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

// Import route handlers
const authRoutes = require("../route/authRoutes");
const seniorCitizenRoutes = require("../route/seniorCitizenRoutes");

app.use("/api", authRoutes);
app.use("/api/senior-citizens", seniorCitizenRoutes); // Authentication related routes

app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging
  // In production, avoid sending detailed error messages to the client
  res.status(500).json({ message: "Something went wrong on the server!" });
});

// Test endpoint for session functionality
app.get("/api/test-session", (req, res) => {
  // Increment a view counter in the session
  req.session.views = (req.session.views || 0) + 1;
  res.send(`Session views: ${req.session.views}`);
});

// Trust the first proxy. Essential if your app is behind a reverse proxy (e.g., Nginx, Load Balancer)
// to correctly determine the client's IP address and protocol (HTTP/HTTPS).
app.set("trust proxy", 1);

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
  // You might want to log the actual URL if it's not localhost in production
});
