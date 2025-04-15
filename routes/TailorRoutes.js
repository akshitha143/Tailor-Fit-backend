const express = require("express");
const router = express.Router();

const {showAllOrders,getAcceptedOrders,OrderAccept,OrderReject,tailorsInfo,tailorsInfobyId ,pendingOrders,markAsCompleted , getOrderSummary} =require("../controllers/TailorController");

router.get("/getallorders/:tailorId/", showAllOrders);

router.put('/accept-order', OrderAccept); 
router.put("/reject-order", OrderReject);

router.get("/accepted-orders/:tailorId", getAcceptedOrders);
router.get("/order-summary/:tailorId", getOrderSummary);
router.get("/tailors-info/", tailorsInfo);

// router.get("/total-orders/:tailorId", totalOrders);
// router.get("/completed-orders/:tailorId", completedOrders);
// router.get("/pending-orders/:tailorId", pendingOrders);

router.post("/mark-as-completed", markAsCompleted);
router.get('/tailors-info/:tailorId', tailorsInfobyId);

module.exports = router;
