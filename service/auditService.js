const Connection = require("../db/Connection");

exports.logAudit = async (userEmail, userRole, action, details) => {
  try {
    await Connection(
      `
      INSERT INTO audit_logs (user, userRole, action, details)
      VALUES (?, ?, ?, ?)
      `,
      [userEmail, userRole, action, details]
    );
  } catch (err) {
    console.error("❌ Failed to log audit entry:", err);
  }
};

exports.getLogAudit = async () => {
  try {
    const rows = await Connection(`SELECT * FROM audit_logs`);
    return rows;
  } catch (err) {
    console.error("❌ Failed to retrieve log audit data:", err);
  }
};

exports.getPaginatedAuditLogs = async (page, limit) => {
  const offset = (page - 1) * limit;

  try {
    const logs = await Connection(
      `SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const totalRows = await Connection(
      `SELECT COUNT(*) AS total FROM audit_logs`
    );
    const total = totalRows[0].total;

    return {
      logs,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    };
  } catch (err) {
    console.error("❌ Failed to retrieve log audit data:", err);
    throw err;
  }
};
