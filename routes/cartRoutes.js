const express = require("express");
const { addToCart, removeFromCart, clearCart, getCart ,adjustQuantity} = require("../controllers/cartController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add/:productId", authMiddleware, addToCart);
router.delete("/remove/:productId", authMiddleware, removeFromCart);
router.delete("/clear", clearCart);
router.get("/getcart", authMiddleware, getCart);
router.put("/updatequantity/:productId",adjustQuantity);


module.exports = router;