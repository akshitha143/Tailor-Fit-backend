const Payment = require("../models/Payment");
const razorpay = require('../config/razorpay');
const Order=require('../models/Order');


const createPayment = async (userId, orderId) => {
    try 
    {
        if (!orderId) 
        {
            return { status: 400, success: false, message: "Order ID is required" };
        }

        const order = await Order.findById(orderId);
        if (!order) 
        {
            return { status: 204, success: false, message: "Order not found" };
        }

        const acceptedItems = order.items.filter(item => item.accepted === "true");

        if (acceptedItems.length === 0) 
        {
            return {
                status: 204,
                success: false,
                message: "No items accepted by tailors"
            };
        }

        const amount = order.totalAmount;
        await order.save(); 

        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_${orderId}`,
            notes: { userId, orderId }
        };

        const razorpayOrder = await razorpay.orders.create(options);

        const payment = new Payment({
            userId,
            orderId,
            razorpayOrderId: razorpayOrder.id,
            amount,
            status: "pending"
        });

        await payment.save();

        return {
            status: 201,
            success: true,
            message: "Payment created successfully",
            razorpayOrder
        };

    } catch (error) {
        console.error("Payment creation failed:", error.message);
        return {
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: error.message
        };
    }
};


const verifyPayment = async(req, res) => 
{
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const secret = Razorpay.key_secret;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
  
    try 
    {
        const isValidSignature = validateWebhookSignature(body, razorpay_signature, secret);
        if (isValidSignature) 
        {
            // Update the order/payment details in your database as needed.
            // (For example, you might find the payment record by razorpayOrderId and update it.)
            res.status(200).json({ status: 'ok' });
            console.log("Payment verification successful");
        } 
        
        const event = req.body.event;
        if (event === "payment.captured") 
        {
            const { order_id, payment_id, amount } = req.body.payload.payment.entity;

            const order=await Order.findById(order_id);
            if (!order) 
            {
                return res.status(404).json({ message: "Order not found" });
            }

            order.status="pending";
            await order.save();
            // Update payment status
            const payment = await Payment.findOneAndUpdate(
                { razorpayOrderId: order_id },
                { razorpayPaymentId: payment_id, status: "completed", amount },
                { new: true }
            );

            if (payment) 
            {
    
                // await axios.put(`http://localhost:8000/api/orders/updateorder/${payment.orderId}`, 
                // {
                //     status: "paid"
                // });
                order.payment_status="paid";
                order.save();
                console.log("Payment Successful, Order Updated:", payment_id);
            }
        }
        
        else
        {
            res.status(400).json({ status: 'verification_failed' });
            console.log("Payment verification failed");
        }

    } 
    
    catch (error) 
    {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error verifying payment' });
    }
};

const success = (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'success.html'));
};

module.exports = { createPayment, verifyPayment, success };
