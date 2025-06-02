const express = require("express");
const router = express.Router();
const seniorCitizenService = require("../services/seniorCitizenService");

// GET: All senior citizens
router.get("/", async (req, res) => {
  try {
    const data = await seniorCitizenService.getAllSeniorCitizens();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Senior citizen by ID
router.get("/:id", async (req, res) => {
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
router.post("/", async (req, res) => {
  try {
    const insertId = await seniorCitizenService.createSeniorCitizen(req.body);
    res.status(201).json({ message: "Senior citizen created.", insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT: Update senior citizen
router.put("/:id", async (req, res) => {
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
router.delete("/:id", async (req, res) => {
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

// GET: Search senior citizens
router.get("/search/:term", async (req, res) => {
  try {
    const results = await seniorCitizenService.searchSeniorCitizens(
      req.params.term
    );
    res.status(200).json(results);
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
    res.status(500).json({ message: error.message });
  }
});

// GET: Filter by barangay (e.g. /barangay/Poblacion)
router.get("/barangay/:barangay", async (req, res) => {
  try {
    const data = await seniorCitizenService.getSeniorCitizensByBarangay(
      req.params.barangay
    );
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
