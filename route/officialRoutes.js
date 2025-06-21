const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const officialService = require("../service/officialService");
const { isAuthenticated } = require("../middleware/authMiddleware");

// ─── MUNICIPAL ROUTES ───────────────────────────────────────────────

// GET all municipal officials
router.get("/municipal", async (req, res) => {
  try {
    const officials = await officialService.getMunicipalOfficials();
    res.json(officials);
  } catch (error) {
    console.error("Error fetching municipal officials:", error);
    res.status(500).json({ message: "Failed to fetch municipal officials" });
  }
});

// POST add municipal official
router.post(
  "/municipal",
  isAuthenticated,
  upload.single("image"),
  async (req, res) => {
    const { name, position, type } = req.body;
    const image = req.file ? req.file.filename : null;
    const user = req.session.user;

    try {
      const result = await officialService.addMunicipalOfficial(
        name,
        position,
        type,
        image,
        user
      );
      res
        .status(201)
        .json({ message: "Municipal official added", id: result.insertId });
    } catch (error) {
      console.error("Error adding municipal official:", error);
      res.status(500).json({ message: "Failed to add municipal official" });
    }
  }
);

// PUT update municipal official
router.put(
  "/municipal/:id",
  isAuthenticated,
  upload.single("image"),
  async (req, res) => {
    const { name, position, type } = req.body;
    const image = req.file ? req.file.filename : null;
    const user = req.session.user;

    try {
      await officialService.updateMunicipalOfficial(
        req.params.id,
        name,
        position,
        type,
        image,
        user
      );
      res.json({ message: "Municipal official updated successfully" });
    } catch (error) {
      console.error("Error updating municipal official:", error);
      res.status(500).json({ message: "Failed to update municipal official" });
    }
  }
);

// DELETE municipal official
router.delete("/municipal/:id", isAuthenticated, async (req, res) => {
  const user = req.session.user;

  try {
    await officialService.deleteMunicipalOfficial(req.params.id, user);
    res.json({ message: "Municipal official deleted successfully" });
  } catch (error) {
    console.error("Error deleting municipal official:", error);
    res.status(500).json({ message: "Failed to delete municipal official" });
  }
});

// ─── BARANGAY ROUTES ───────────────────────────────────────────────

// GET all barangay officials
router.get("/barangay", async (req, res) => {
  try {
    const results = await officialService.getBarangayOfficials();
    res.json(results);
  } catch (error) {
    console.error("Error fetching barangay officials:", error);
    res.status(500).json({ message: "Failed to fetch barangay officials" });
  }
});

// POST add barangay official
router.post(
  "/barangay",
  isAuthenticated,
  upload.single("image"),
  async (req, res) => {
    const { barangay_name, president_name, position } = req.body;
    const image = req.file ? req.file.filename : null;
    const user = req.session.user;

    try {
      const result = await officialService.addBarangayOfficial(
        barangay_name,
        president_name,
        position,
        image,
        user
      );
      res
        .status(201)
        .json({ message: "Barangay official added", id: result.insertId });
    } catch (error) {
      console.error("Error adding barangay official:", error);
      res.status(500).json({ message: "Failed to add barangay official" });
    }
  }
);

// PUT update barangay official
router.put(
  "/barangay/:id",
  isAuthenticated,
  upload.single("image"),
  async (req, res) => {
    const {
      barangay_name,
      president_name,
      position,
      existing_image, // 🔁 sent from frontend if no new image is uploaded
    } = req.body;

    const image = req.file ? req.file.filename : existing_image;
    const user = req.session.user;

    try {
      await officialService.updateBarangayOfficial(
        req.params.id,
        barangay_name,
        president_name,
        position,
        image,
        user
      );
      res.json({ message: "Barangay official updated successfully" });
    } catch (error) {
      console.error("Error updating barangay official:", error);
      res.status(500).json({ message: "Failed to update barangay official" });
    }
  }
);

// DELETE barangay official
router.delete("/barangay/:id", isAuthenticated, async (req, res) => {
  const user = req.session.user;

  try {
    await officialService.deleteBarangayOfficial(req.params.id, user);
    res.json({ message: "Barangay official deleted successfully" });
  } catch (error) {
    console.error("Error deleting barangay official:", error);
    res.status(500).json({ message: "Failed to delete barangay official" });
  }
});

module.exports = router;
