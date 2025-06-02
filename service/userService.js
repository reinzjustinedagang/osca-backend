const Connection = require("../db/Connection");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

// LOGIN SERVICE
exports.login = async (email, password) => {
  try {
    const results = await Connection(
      "SELECT id, username, email, password, cp_number, role, last_logout FROM users WHERE email = ?",
      [email]
    );

    if (results.length === 0) return null;

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return null;

    return {
      username: user.username,
      id: user.id,
      email: user.email,
      cp_number: user.cp_number,
      role: user.role,
      last_logout: user.last_logout,
    };
  } catch (error) {
    console.error("Error in login service:", error);
    throw error;
  }
};

// REGISTER SERVICE
exports.register = async (username, email, password, cp_number, role) => {
  try {
    const existingUsers = await Connection(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      const error = new Error("User with this email already exists.");
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const query = `
      INSERT INTO users (id, username, email, password, cp_number, role)
      VALUES (NULL, ?, ?, ?, ?, ?)
    `;
    const result = await Connection(query, [
      username,
      email,
      hashedPassword,
      cp_number,
      role,
    ]);

    return result.affectedRows === 1;
  } catch (error) {
    console.error("Error in register service:", error);
    throw error;
  }
};

// LOGOUT SERVICE
exports.logout = async (userId) => {
  try {
    const query = `UPDATE users SET last_logout = NOW() WHERE id = ?`;
    await Connection(query, [userId]);
    return true;
  } catch (error) {
    console.error("Error in logout service:", error);
    throw error;
  }
};
