const express = require("express");
const router = express.Router();
const seniorCitizenService = require("../service/seniorCitizenService");

// GET: Senior citizen by ID
router.get("/get/:id", async (req, res) => {
  try {
    const citizen = await seniorCitizenService.getSeniorCitizenById(
      req.params.id
    );
    if (!citizen) {
      return res.status(404).json({ message: "Senior citizen not found." });
    }
    res.status(200).json(citizen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Create new senior citizen
router.post("/create", async (req, res) => {
  try {
    const insertId = await seniorCitizenService.createSeniorCitizen(req.body);
    res.status(201).json({ message: "Senior citizen created.", insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT: Update senior citizen
router.put("/update/:id", async (req, res) => {
  try {
    const success = await seniorCitizenService.updateSeniorCitizen(
      req.params.id,
      req.body
    );
    if (!success) {
      return res
        .status(404)
        .json({ message: "Senior citizen not found or not updated." });
    }
    res.status(200).json({ message: "Senior citizen updated." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE: Remove senior citizen
router.delete("/delete/:id", async (req, res) => {
  try {
    const success = await seniorCitizenService.deleteSeniorCitizen(
      req.params.id
    );
    if (!success) {
      return res
        .status(404)
        .json({ message: "Senior citizen not found or not deleted." });
    }
    res.status(200).json({ message: "Senior citizen deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Paginated list (e.g. /page?page=1&limit=10)
router.get("/page", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const data = await seniorCitizenService.getPaginatedSeniorCitizens(
      page,
      limit
    );

    res.status(200).json(data);
  } catch (error) {
    console.error("Failed to fetch paginated senior citizens:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/sms-citizens", seniorCitizenService.getSmsRecipients);

module.exports = router;
