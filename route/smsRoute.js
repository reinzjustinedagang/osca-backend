const express = require("express");
const smsService = require("../service/smsService");

const router = express.Router();

// ✅ Send SMS to one or multiple numbers
router.post("/send-sms", async (req, res) => {
  const { number, numbers, message } = req.body;

  const recipients = numbers || (number ? [number] : null);

  if (
    !recipients ||
    !Array.isArray(recipients) ||
    recipients.length === 0 ||
    !message
  ) {
    return res
      .status(400)
      .json({ error: "Array of numbers and a message are required." });
  }

  try {
    const result = await smsService.sendSMS(message, recipients);

    if (result.success) {
      res.json({
        message: "✅ Broadcast sent successfully",
        data: result.response,
      });
    } else {
      res.status(500).json({
        message: "❌ Failed to send broadcast",
        error: result.response,
      });
    }
  } catch (err) {
    console.error("Error sending SMS:", err);
    res.status(500).json({ message: "❌ Server error while sending SMS" });
  }
});

// ✅ Delete SMS log by ID
router.delete("/delete/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const success = await smsService.deleteSms(id);

    if (success) {
      res.status(200).json({ message: "✅ Message deleted successfully." });
    } else {
      res
        .status(404)
        .json({ message: "❌ Message not found or deletion failed." });
    }
  } catch (err) {
    console.error("Error deleting SMS:", err);
    res.status(500).json({ message: "❌ Server error while deleting SMS" });
  }
});

// In smsRoutes.js

router.get("/logs", async (req, res) => {
  try {
    const { recipient, status, startDate, endDate } = req.query;

    const filters = {
      recipient,
      status,
      startDate,
      endDate,
    };

    // Remove undefined or empty filters
    Object.keys(filters).forEach(
      (key) =>
        (filters[key] === undefined || filters[key] === "") &&
        delete filters[key]
    );

    const logs = await smsService.getSmsLogs(filters);
    res.json({ success: true, logs });
  } catch (err) {
    console.error("Error fetching SMS logs:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to retrieve SMS logs." });
  }
});

// GET message history
router.get("/history", async (req, res) => {
  try {
    const logs = await smsService.getSMSHistory();
    res.json(logs);
  } catch (error) {
    console.error("Error fetching SMS history:", error);
    res.status(500).json({ message: "Failed to fetch SMS history" });
  }
});

router.put("/sms-credentials", smsService.updateSmsCredentials);

router.get("/sms-credentials", smsService.getSmsCredentials);

module.exports = router;
