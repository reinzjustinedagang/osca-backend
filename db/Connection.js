// Import the mysql2 library for database interaction.
const mysql = require("mysql2");
// Load environment variables from a .env file.
require("dotenv").config();

// Create a MySQL database connection pool.
// Using createPool is generally better for production applications as it manages multiple connections,
// but for a simple script, createConnection is acceptable.
// The password field is intentionally left empty as per the user's original code.
const db = mysql.createConnection({
  host: process.env.DB_HOST, // Database host (e.g., 'localhost')
  user: process.env.DB_USER, // Database user (e.g., 'root')
  password: "", // Database password (empty as per original code)
  port: process.env.DB_PORT, // Database port (e.g., 3306)
  database: process.env.DB_DATABASE, // Database name
});

// Attempt to connect to the MySQL database.
db.connect((err) => {
  if (err) {
    // If there's an error during connection, log it and exit.
    // It's good practice to handle this gracefully, perhaps by retrying or notifying an admin.
    console.error("❌ MySQL connection error:", err.message);
    return; // Exit the function if connection fails
  }
  // If connection is successful, log a success message.
  console.log("✅ Connected to MySQL database.");
});

db.query(
  `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    cp_number VARCHAR(15) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_logout TIMESTAMP NULL DEFAULT NULL
  )
  `,
  (err) => {
    if (err) {
      console.error("❌ Failed to create users table:", err);
    } else {
      console.log("✅ users table ready.");
    }
  }
);

// Create the 'otp_codes' table if it does not already exist.
// This prevents errors if the script is run multiple times.
db.query(
  `
  CREATE TABLE IF NOT EXISTS otp_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier, auto-increments
    mobile VARCHAR(15) NOT NULL,        -- Mobile number, cannot be null
    otp VARCHAR(6) NOT NULL,            -- One-Time Password, cannot be null
    purpose VARCHAR(50),                -- Purpose of the OTP (e.g., 'registration', 'password_reset')
    expires_at DATETIME,                -- Timestamp when the OTP expires
    used BOOLEAN DEFAULT 0,             -- Flag to check if the OTP has been used (0 for false, 1 for true)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp when the record was created
  )
`,
  (err) => {
    if (err) {
      // Log an error if table creation fails.
      console.error("❌ Failed to create otp_codes table:", err);
    } else {
      // Log a success message if the table is created or already exists.
      console.log("✅ otp_codes table ready.");
    }
  }
);

// Create the 'sms_logs' table if it does not already exist.
// This ensures idempotency, meaning running the script multiple times has the same effect.
db.query(
  `CREATE TABLE IF NOT EXISTS sms_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,    -- Unique identifier, auto-increments
    recipients TEXT NOT NULL,             -- Comma-separated list of recipients or JSON string, cannot be null
    message TEXT NOT NULL,                -- The SMS message content, cannot be null
    status VARCHAR(20) NOT NULL,          -- Status of the SMS (e.g., 'SENT', 'FAILED', 'DELIVERED'), cannot be null
    reference_id VARCHAR(100),            -- External reference ID for the SMS (e.g., from an SMS gateway)
    credit_used DECIMAL(10,2) DEFAULT 0,  -- Amount of credit used for the SMS, defaults to 0.00
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp when the record was created
  )`,
  (err) => {
    if (err) {
      // Log an error if table creation fails.
      console.error("❌ Failed to create sms_logs table:", err);
    } else {
      // Log a success message if the table is created or already exists.
      console.log("✅ sms_logs table ready.");
    }
  }
);

// Create the 'senior_citizens' table if it does not already exist.
// This table will store detailed information about senior citizens.
db.query(
  `
  CREATE TABLE IF NOT EXISTS senior_citizens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    middleName VARCHAR(255),
    suffix VARCHAR(50),
    age INT,
    gender VARCHAR(10),
    birthdate DATE,
    civilStatus VARCHAR(50),
    religion VARCHAR(100),
    bloodType VARCHAR(5),
    houseNumberStreet VARCHAR(255),
    barangay VARCHAR(100),
    municipality VARCHAR(100),
    province VARCHAR(100),
    zipCode VARCHAR(10),
    mobileNumber VARCHAR(15),
    telephoneNumber VARCHAR(15),
    emailAddress VARCHAR(255),
    validIdType VARCHAR(100),
    validIdNumber VARCHAR(100),
    philSysId VARCHAR(100),
    sssNumber VARCHAR(100),
    gsisNumber VARCHAR(100),
    philhealthNumber VARCHAR(100),
    tinNumber VARCHAR(100),
    employmentStatus VARCHAR(50),
    occupation VARCHAR(255),
    highestEducation VARCHAR(100),
    classification VARCHAR(50),
    monthlyPension DECIMAL(10,2),
    emergencyContactName VARCHAR(255),
    emergencyContactRelationship VARCHAR(100),
    emergencyContactNumber VARCHAR(15),
    healthStatus VARCHAR(50),
    healthNotes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`,
  (err) => {
    if (err) {
      console.error("❌ Failed to create senior_citizens table:", err);
    } else {
      console.log("✅ senior_citizens table ready.");
    }
  }
);

// Export a function that wraps database queries in a Promise.
// This allows for cleaner asynchronous code using async/await.
module.exports = (query, params = []) => {
  return new Promise((resolve, reject) => {
    // Execute the database query with provided parameters.
    db.query(query, params, (err, results) => {
      if (err) {
        // If there's an error during the query, reject the Promise.
        return reject(err);
      }
      // If the query is successful, resolve the Promise with the results.
      resolve(results);
    });
  });
};
