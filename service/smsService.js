const axios = require("axios");
const Connection = require("../db/Connection");
const { logAudit } = require("./auditService");

exports.sendSMS = async (message, recipients) => {
  try {
    // 🟩 1. Fetch credentials from DB
    const [credentials] = await Connection(
      "SELECT * FROM sms_credentials LIMIT 1"
    );

    if (!credentials) {
      throw new Error("SMS credentials not found in database.");
    }

    const payload = {
      Email: credentials.email,
      Password: credentials.password,
      ApiCode: credentials.api_code,
      ClientId: "SYSTEM_CLIENT_001", // or load from DB or env
      SenderId: "ITEXMO SMS",
      Recipients: recipients,
      Message: message,
    };

    // 🟩 2. Send SMS
    const response = await axios.post(
      "https://api.itexmo.com/api/broadcast",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;

    // 🟩 3. Log result in DB
    await Connection(
      `INSERT INTO sms_logs (recipients, message, status, reference_id, credit_used)
       VALUES (?, ?, ?, ?, ?)`,
      [
        JSON.stringify(recipients),
        message,
        data.Error === false ? "Success" : "Failed",
        data.ReferenceId || null,
        data.TotalCreditUsed || 0,
      ]
    );

    return data.Error === false && data.Accepted > 0
      ? { success: true, response: data }
      : { success: false, response: `iTexMo error: ${JSON.stringify(data)}` };
  } catch (error) {
    console.error("Error sending SMS:", error);

    await Connection(
      `INSERT INTO sms_logs (recipients, message, status, reference_id, credit_used)
       VALUES (?, ?, ?, ?, ?)`,
      [JSON.stringify(recipients), message, "Request Failed", null, 0]
    );

    return {
      success: false,
      response:
        error.response?.status === 400
          ? "❌ Failed to send broadcast: Insufficient credits or bad request."
          : `Request failed: ${error.message}`,
    };
  }
};

exports.deleteSms = async (id) => {
  try {
    const query = `DELETE FROM sms_logs WHERE id = ?`;
    const result = await Connection(query, [id]);

    if (result.affectedRows > 0) {
      return true;
    } else {
      console.warn("No Message found with ID:", id);
      return false;
    }
  } catch (err) {
    console.error("Error deleting Message:", err);
    return false;
  }
};

// In your smsService.js

exports.getSmsCredentials = async (req, res) => {
  try {
    const [credentials] = await Connection(
      "SELECT email, password, api_code FROM sms_credentials WHERE id = 1"
    );
    if (!credentials) {
      return res.status(404).json({ message: "Credentials not found" });
    }
    res.json(credentials);
  } catch (err) {
    console.error("Error fetching SMS credentials:", err);
    res.status(500).json({ message: "Server error fetching credentials" });
  }
};

// PUT /api/sms-credentials
exports.updateSmsCredentials = async (req, res) => {
  const { email, password, api_code } = req.body;

  try {
    // Check if any record exists
    const existing = await Connection(
      `SELECT * FROM sms_credentials WHERE id = 1`
    );

    let actionType = "UPDATE";
    let changes = [];

    if (existing.length === 0) {
      // No record exists, perform INSERT
      await Connection(
        `INSERT INTO sms_credentials (id, email, password, api_code) VALUES (1, ?, ?, ?)`,
        [email, password, api_code]
      );
      actionType = "INSERT";
      changes.push("Initial SMS credentials created.");
    } else {
      const oldData = existing[0];

      // Perform the update
      await Connection(
        `UPDATE sms_credentials SET email = ?, password = ?, api_code = ? WHERE id = 1`,
        [email, password, api_code]
      );

      // Track changes for audit
      if (oldData.email !== email)
        changes.push(`Email changed from '${oldData.email}' to '${email}'`);
      if (oldData.password !== password) changes.push("Password was updated");
      if (oldData.api_code !== api_code) changes.push(`API Code changed`);
    }

    // Get user info
    const userEmail = req.user?.email || "Unknown";
    const userRole = req.user?.role || "Admin";

    // Log if any changes or insert happened
    if (changes.length > 0) {
      await logAudit(
        userEmail,
        userRole,
        actionType,
        "SMS_CREDENTIALS",
        changes.join("; ")
      );
    }

    res.status(200).json({
      message:
        actionType === "INSERT"
          ? "SMS credentials added."
          : "SMS credentials updated.",
    });
  } catch (err) {
    console.error("Error updating/adding SMS credentials:", err);
    res.status(500).json({ message: "Failed to save credentials." });
  }
};

exports.getSMSHistory = async () => {
  const logs = await Connection(`
    SELECT id, recipients, message, status, reference_id, credit_used, created_at
    FROM sms_logs
    ORDER BY created_at DESC
  `);
  return logs;
};
