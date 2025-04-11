const  { createMeasurement , getmeasurement  } = require("../controllers/sizesControllers.js"); 
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
router.post("/create",authMiddleware ,createMeasurement);
router.get("/getallmeasurements",authMiddleware, getmeasurement);

module.exports = router;