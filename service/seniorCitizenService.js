const Connection = require("../db/Connection");

// Fetch senior citizen by ID
exports.getSeniorCitizenById = async (id) => {
  try {
    const result = await Connection(
      `SELECT * FROM senior_citizens WHERE id = ?`,
      [id]
    );
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error(`Error fetching senior citizen with ID ${id}:`, error);
    throw new Error(`Failed to retrieve senior citizen with ID ${id}.`);
  }
};

// Create a new senior citizen
exports.createSeniorCitizen = async (seniorCitizenData) => {
  try {
    const query = `INSERT INTO senior_citizens SET ?`;
    const result = await Connection(query, seniorCitizenData);
    return result.insertId;
  } catch (error) {
    console.error("Error creating senior citizen:", error);
    throw new Error("Failed to create senior citizen.");
  }
};

// Update an existing senior citizen
exports.updateSeniorCitizen = async (id, updatedData) => {
  try {
    const query = `UPDATE senior_citizens SET ? WHERE id = ?`;
    const result = await Connection(query, [updatedData, id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`Error updating senior citizen with ID ${id}:`, error);
    throw new Error(`Failed to update senior citizen with ID ${id}.`);
  }
};

// Delete a senior citizen
exports.deleteSeniorCitizen = async (id) => {
  try {
    const query = `DELETE FROM senior_citizens WHERE id = ?`;
    const result = await Connection(query, [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`Error deleting senior citizen with ID ${id}:`, error);
    throw new Error(`Failed to delete senior citizen with ID ${id}.`);
  }
};

// Paginated retrieval
exports.getPaginatedSeniorCitizens = async (page, limit) => {
  const offset = (page - 1) * limit;
  try {
    // Get paginated citizens
    const citizens = await Connection(
      `SELECT * FROM senior_citizens ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Get total count of citizens
    const totalRows = await Connection(
      `SELECT COUNT(*) AS total FROM senior_citizens`
    );
    const total = totalRows[0].total;

    return {
      citizens, // the paginated data
      total, // total count
      totalPages: Math.ceil(total / limit),
      page,
    };
  } catch (error) {
    console.error(
      `Error fetching paginated senior citizens (page: ${page}, limit: ${limit}):`,
      error
    );
    throw new Error("Failed to retrieve paginated senior citizens.");
  }
};

exports.getSmsRecipients = async (req, res) => {
  try {
    const result = await Connection(`
      SELECT 
        id,
        CONCAT_WS(' ', firstName, middleName, lastName, suffix) AS name,
        COALESCE(mobileNumber, emergencyContactNumber) AS contact,
        barangay
      FROM senior_citizens
      WHERE mobileNumber IS NOT NULL OR emergencyContactNumber IS NOT NULL
    `);
    res.json(result);
  } catch (error) {
    console.error("Error fetching SMS recipients:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
