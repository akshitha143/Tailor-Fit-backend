const express = require("express");
const router = express.Router();
const { createPayment, verifyPayment } = require("../controllers/paymentController");
const authMiddleware = require('../middleware/authMiddleware');

router.post("/create/:orderId" ,  createPayment);


router.post("/verify" , verifyPayment);



module.exports = router;
