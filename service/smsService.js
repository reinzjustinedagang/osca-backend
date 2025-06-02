const axios = require("axios");
const Connection = require("../db/Connection");

const EMAIL = "reinzjustinedagang.bsit@gmail.com";
const PASSWORD = "Iamreinz2004";
const API_CODE = "TR-REINZ654500_HZMUO";

exports.sendSMS = async (message, recipients) => {
  try {
    const payload = {
      Email: EMAIL,
      Password: PASSWORD,
      ApiCode: API_CODE,
      Recipients: recipients,
      Message: message,
    };

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

    // ✅ Save result to database
    await Connection(
      `INSERT INTO sms_logs ` +
        `(recipients, message, status, reference_id, credit_used) ` +
        `VALUES (?, ?, ?, ?, ?)`,
      [
        JSON.stringify(recipients),
        message,
        data.Error === false ? "Success" : "Failed",
        data.ReferenceId || null,
        data.TotalCreditUsed || 0,
      ]
    );

    if (data && data.Error === false && data.Accepted > 0) {
      return { success: true, response: data };
    } else {
      return {
        success: false,
        response: `iTexMo error: ${JSON.stringify(data)}`,
      };
    }
  } catch (error) {
    // ✅ Log the failed attempt too
    await Connection(
      `INSERT INTO sms_logs ` +
        `(recipients, message, status, reference_id, credit_used) ` +
        `VALUES (?, ?, ?, ?, ?)`,
      [JSON.stringify(recipients), message, "Request Failed", null, 0]
    );

    // Check if it's a 400 error (likely no credits or bad request)
    if (error.response && error.response.status === 400) {
      return {
        success: false,
        response:
          "❌ Failed to send broadcast: Insufficient credits or bad request.",
      };
    }

    return {
      success: false,
      response: `Request failed: ${error.message}`,
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

exports.getSmsLogs = async (filters = {}) => {
  // Filters: { recipient, status, startDate, endDate }
  let query = "SELECT * FROM sms_logs WHERE 1=1";
  const params = [];

  if (filters.recipient) {
    query += " AND JSON_CONTAINS(recipients, ?)";
    params.push(`"${filters.recipient}"`); // JSON_CONTAINS expects a JSON string value
  }

  if (filters.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }

  if (filters.startDate) {
    query += " AND created_at >= ?";
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    query += " AND created_at <= ?";
    params.push(filters.endDate);
  }

  query += " ORDER BY created_at DESC";

  const rows = await Connection(query, params);
  return rows;
};
