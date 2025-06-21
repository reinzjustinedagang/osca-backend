const Connection = require("../db/Connection");
const { logAudit } = require("./auditService");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

exports.getUser = async (id) => {
  try {
    const user = await Connection(
      "SELECT id, username, email, cp_number, role, last_logout FROM users WHERE id = ?",
      [id]
    );
    return user.length > 0 ? user[0] : null;
  } catch (error) {
    console.error("Error fetching user by ID:", error); // 🔁 Fix wrong variable name
    return null;
  }
};

// GET ALL USERS SERVICE
exports.getAllUsers = async () => {
  try {
    const users = await Connection(`
      SELECT id, username, email, cp_number, role, status, last_logout
      FROM users
      ORDER BY username ASC
    `);
    return users;
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw error;
  }
};

exports.deleteUser = async (id, actingUserEmail, actingUserRole) => {
  try {
    const user = await Connection("SELECT username FROM users WHERE id = ?", [
      id,
    ]);
    if (user.length === 0) return false;

    const result = await Connection("DELETE FROM users WHERE id = ?", [id]);

    if (result.affectedRows === 1) {
      await logAudit(
        actingUserEmail,
        actingUserRole,
        "DELETE",
        `Deleted user '${user[0].username}' with ID ${id}.`
      );
    }

    return result.affectedRows === 1;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

// LOGIN SERVICE
exports.login = async (email, password) => {
  try {
    const results = await Connection(
      "SELECT id, username, email, password, cp_number, role, last_logout, status FROM users WHERE email = ?",
      [email]
    );

    if (results.length === 0) return null;

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return null;

    // Set status to 'active' on login
    await Connection("UPDATE users SET status = 'active' WHERE id = ?", [
      user.id,
    ]);

    await logAudit(
      user.email,
      user.role,
      "LOGIN",
      `User '${user.username}' logged in.`
    );

    return {
      username: user.username,
      id: user.id,
      email: user.email,
      cp_number: user.cp_number,
      role: user.role,
      last_logout: user.last_logout,
      status: user.status,
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

    // ✅ Log registration
    if (result.affectedRows === 1) {
      await logAudit(
        email,
        role,
        "REGISTER",
        `New user '${username}' registered.`
      );
    }

    return result.affectedRows === 1;
  } catch (error) {
    console.error("Error in register service:", error);
    throw error;
  }
};

exports.updateUserProfile = async (id, username, email, cp_number) => {
  try {
    // Fetch old data to compare for audit logging
    const [oldData] = await Connection(
      "SELECT username, email, cp_number, role FROM users WHERE id = ?",
      [id]
    );

    const query = `UPDATE users SET username = ?, email = ?, cp_number = ? WHERE id = ?`;
    const result = await Connection(query, [username, email, cp_number, id]);

    if (result.affectedRows === 1) {
      const changes = [];

      // Compare each field and record changes
      if (oldData.username !== username) {
        changes.push(`username: '${oldData.username}' → '${username}'`);
      }
      if (oldData.email !== email) {
        changes.push(`email: '${oldData.email}' → '${email}'`);
      }
      if (oldData.cp_number !== cp_number) {
        changes.push(`contact number: '${oldData.cp_number}' → '${cp_number}'`);
      }

      // Construct the audit detail message
      const details =
        changes.length > 0 ? changes.join(", ") : "No changes detected.";

      // Log the audit with specific changes
      await logAudit(
        oldData.email, // Use old email for logging the actor if email was changed
        oldData.role,
        "UPDATE",
        `Updated profile for user ${oldData.username}: ${details}`
      );
    }

    return result.affectedRows === 1;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

exports.updateUserInfo = async (
  id,
  username,
  email,
  password,
  cp_number,
  role
) => {
  try {
    const [oldData] = await Connection(
      "SELECT username, email, password, cp_number, role FROM users WHERE id = ?",
      [id]
    );

    let hashedPassword = oldData.password;
    let passwordChanged = false;

    // Check if password is being changed (non-empty and different)
    if (password && password !== oldData.password) {
      hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      passwordChanged = true;
    }

    const query = `
      UPDATE users 
      SET username = ?, email = ?, password = ?, cp_number = ?, role = ? 
      WHERE id = ?
    `;
    const result = await Connection(query, [
      username,
      email,
      hashedPassword,
      cp_number,
      role,
      id,
    ]);

    if (result.affectedRows === 1) {
      let changes = [];

      if (oldData.username !== username) {
        changes.push(`username: '${oldData.username}' → '${username}'`);
      }
      if (oldData.email !== email) {
        changes.push(`email: '${oldData.email}' → '${email}'`);
      }
      if (oldData.cp_number !== cp_number) {
        changes.push(`cp_number: '${oldData.cp_number}' → '${cp_number}'`);
      }
      if (oldData.role !== role) {
        changes.push(`role: '${oldData.role}' → '${role}'`);
      }
      if (passwordChanged) {
        changes.push(`password: '[REDACTED]' → '[REDACTED]'`);
      }

      const details =
        changes.length > 0 ? changes.join(", ") : "No changes detected.";

      await logAudit(
        email,
        oldData.role,
        "UPDATE",
        `Updated user info for ${username}: ${details}`
      );
    }

    return result.affectedRows === 1;
  } catch (error) {
    console.error("Error updating user info:", error);
    throw error;
  }
};

exports.changePassword = async (id, currentPassword, newPassword) => {
  try {
    const user = await Connection("SELECT password FROM users WHERE id = ?", [
      id,
    ]);
    if (user.length === 0) return false;

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      user[0].password
    );
    if (!passwordMatch) return false;

    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const query = `UPDATE users SET password = ? WHERE id = ?`;
    const result = await Connection(query, [hashedNewPassword, id]);
    return result.affectedRows === 1;
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
};

// LOGOUT SERVICE
exports.logout = async (userId) => {
  try {
    const [user] = await Connection(
      "SELECT username, email, role FROM users WHERE id = ?",
      [userId]
    );
    await Connection("UPDATE users SET last_logout = NOW() WHERE id = ?", [
      userId,
    ]);

    await Connection("UPDATE users SET status = 'inactive' WHERE id = ?", [
      userId,
    ]);

    // ✅ Log logout
    await logAudit(
      user.email,
      user.role,
      "LOGOUT",
      `User '${user.username}' logged out.`
    );

    return true;
  } catch (error) {
    console.error("Error in logout service:", error);
    throw error;
  }
};
