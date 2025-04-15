const Payment = require("../models/Payment");
const razorpay = require('../config/razorpay');
const Order=require('../models/Order');
const Razorpay=require('razorpay');
const crypto = require("crypto");
// controllers/paymentController.js

const createPayment = async (req, res) => {
  try {
    // Temporary assignment for debugging purposes.
    const user = "67fa451c4333314c4f8b77c1";
    const orderId = req.params.orderId;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }
    console.log("Step 1: Order ID received");

    const order = await Order.findById(orderId);
    console.log("Order fetched:", order);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    console.log("Step 2: Order found");

    // Filter for items accepted by tailors
    const acceptedItems = order.items.filter(item => item.accepted === "true");
    if (acceptedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items accepted by tailors"
      });
    }
    console.log("Step 3: Accepted items found");

    // Calculate the total for accepted items
    // If your items do not have a price field, consider using order.totalAmount instead
    let acceptedItemsTotal = acceptedItems.reduce((total, item) => {
      if (typeof item.price !== "undefined") {
        return total + (item.price * item.quantity);
      }
      return total; // Skip if price is undefined
    }, 0);

    // Fallback to order.totalAmount if no price information exists in items.
    if (!acceptedItemsTotal || acceptedItemsTotal === 0) {
      acceptedItemsTotal = order.totalAmount;
    }

    console.log("Step 4: Calculated accepted items total:", acceptedItemsTotal);

    // Validate the computed amount before proceeding.
    if (!acceptedItemsTotal || isNaN(acceptedItemsTotal)) {
      return res.status(400).json({
        success: false,
        message: "Calculated payment amount is invalid."
      });
    }

    const options = {
      amount: acceptedItemsTotal * 100, // Amount in paisa
      currency: "INR",
      receipt: `receipt_${orderId}`,
      notes: { user, orderId }
    };

    // Set Razorpay credentials (in production, consider using environment variables)
    const RAZORPAY_KEY_ID = "rzp_test_hg05XqFOTZJWyG";
    const RAZORPAY_KEY_SECRET = "DCsIx9Fm5uBl86xTBgw5ooCn";

    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET
    });
    console.log("Step 5: Razorpay instance created");

    // Create the order with Razorpay
    const razorpayOrder = await razorpay.orders.create(options);
    console.log("Step 6: Razorpay order created", razorpayOrder);

    // Create and save a Payment record in your database
    const payment = new Payment({
     userId: user,      
      orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: acceptedItemsTotal,
      status: "pending"
    });
    await payment.save();
    console.log("Step 7: Payment record saved");

    return res.status(201).json({
      success: true,
      message: "Payment created successfully",
      razorpayOrder
    });
  } catch (error) {
    // Log the full error object instead of just error.message
    console.error("Payment creation failed:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.toString() // Optional: send error.toString() for debugging
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    // Replace `your_secret_key` with your actual Razorpay secret key.
    const secret = process.env.RAZORPAY_SECRET || "DCsIx9Fm5uBl86xTBgw5ooCn";
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }

    // Update payment record to "Paid"
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { status: "paid" }
    );

    // Retrieve and update order: change payment status and update each item's status
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Mark the overall payment as paid
    order.payment_status = "Paid";

    // Change each order item's status from "Processing" to "Pending"
    order.items = order.items.map((item) => {
      if (item.status === "Processing") {
        item.status = "Pending";
      }
      return item;
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified and order updated successfully"
    });
  } catch (error) {
    console.error("Error verifying payment:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



module.exports = { createPayment, verifyPayment  };
