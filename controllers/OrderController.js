const Order = require("../models/Order");
const Cart=require("../models/Cart");
const {clearCart} = require("../controllers/cartController");
const {createPayment}=require("../controllers/paymentController");

const placeOrder = async (req, res) => 
{
    try 
    { 
        const userId=req.user.userId;
        if(!userId) return res.status(400).json({message:"userId is required"});
         const cart = await Cart.findOne({ userId });

        if (!cart || cart.items.length === 0) 
        {
            return res.status(400).json({ message: "Your cart is empty" });
        }
        const totalAmount = cart.totalPrice;

        const orderProducts = cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            accepted: "null",
            tailorId: item.tailorId,
            status: "Processing"
        }));

        const order = new Order({
            userId,
            items: orderProducts,
            totalAmount
        });

        await order.save(); 

        await clearCart(userId);
        // await cart.save();

        
        
        res.status(200).json({
            orderId: order._id,
            message: "Please confirm to proceed with payment.",

            
        });


    } 
    catch (error) 
    {
        res.status(500).json({ error: error.message });
    }
};

const pendingOrders = async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log(userId);

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const orders = await Order.find({ userId })
            .populate("items.productId", "name description image price");

        if (!orders || orders.length === 0) {
            return res.status(204).json({ message: "No pending orders found" });
        }

        
        const pendingItems = [];

        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.accepted === "null") {
                    pendingItems.push({
                        orderId: order._id,
                        product: item.productId,
                        quantity: item.quantity,
                        tailorId: item.tailorId,
                        accepted: item.accepted
                    });
                }
                if (item.accepted === "true" && order.payment_status === "Unpaid") 
                {
                    pendingItems.push({
                        orderId: order._id,
                        product: item.productId,
                        quantity: item.quantity,
                        tailorId: item.tailorId,
                        accepted: item.accepted
                    });
                }
            });
        });

        if (pendingItems.length === 0) {
            return res.status(204).json({ message: "No pending items found" });
        }

        res.status(200).json({ success: true, pendingItems });
    } catch (error) {
        console.error("Error fetching pending orders:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


//check this once i am not done yet...because of payment controller not in function
const confirmAndPayOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const userId = req.user.userId;

       
        const paymentResponse = await createPayment(orderId, userId);
        const { success, error } = paymentResponse;

        
        if (!success) {
            return res.status(400).json({
                message: "Payment failed. Order not confirmed.",
                reason: error || "Unknown error"
            });
        }

        

       
        res.status(200).json({
            success: true,
            message: "Order confirmed and payment successful",
           
        });

    } 
    
    catch (error) 
    {
        console.error(error.message);
        res.status(500).json({ error: error.message });
    }
};


const getAllOrders = async (req, res) => 
{
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 5 } = req.query;

        const totalOrders = await Order.countDocuments({ userId });


       // console.log(totalOrders);
        if (totalOrders === 0) {
            return res.status(200).json({
                success: true,
                totalPages: 0,
                currentPage: 0, 
                totalOrders: 0,
                data: []
            });
        }

        const orders = await Order.find({ userId })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .populate("items.productId","name image description price");

        console.log(orders);

        res.status(200).json({
            success: true,
            totalPages: Math.ceil(totalOrders / limit),
            currentPage: Number(page),
            totalOrders,
            data: orders
        });

    } catch (error) {
        res.status(500).json({ error: "Something went wrong while fetching orders" });
    }
};


const getOrderById = async (req, res) =>
 {
    try {
        const orderId  = req.params.id;

        const order = await Order.findById(orderId)
             .populate({
                 path: "items.productId",
                 select: "name price image description"
             });
        if (!order) {
            return res.status(204).json({ message: "Order not found" });
        }

    res.status(200).json({ success: true, order});

    } 
    catch (error) 
    {
        console.error("Error fetching order products:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!order) return res.status(204).json({ message: "Order not found" });

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ error: "Something went wrong while updating order status" });
    }
};


const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        res.status(200).json({ success: true, message: "Order deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Something went wrong while deleting order" });
    }
};


const deleteProductFromOrder = async (req, res) => {
    try {
        const { orderId, productId } = req.body;

        
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        
        const initialLength = order.items.length;
        order.items = order.items.filter(item => item.productId.toString() !== productId);

      
        if (order.items.length === initialLength) {
            return res.status(404).json({ message: "Product not found in the order" });
        }

      
        await order.save();

        res.status(200).json({ success: true, message: "Product removed from order successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Something went wrong while removing the product from the order" });
    }
};


module.exports = 
{
    placeOrder,
    pendingOrders,
    confirmAndPayOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
    deleteProductFromOrder
};