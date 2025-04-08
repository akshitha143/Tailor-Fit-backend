const Tailor = require("../models/Tailor");
const Order = require("../models/Order");
const mongoose = require("mongoose");

const showAllOrders = async (req, res) => {
  try {
    const tailorId = req.params.tailorId;
    if (!tailorId) return res.status(400).json({ message: "Tailor ID is required" });

    const tailorObjectId = new mongoose.Types.ObjectId(tailorId);

    const orders = await Order.find({
      items: {
        $elemMatch: {
          tailorId: tailorObjectId,
          accepted: "null"
        }
      }
    }).populate('items.productId');

    if (!orders.length) return res.status(204).json({ message: "No orders found" });

   
    const products = orders.flatMap(order =>
      order.items
        .filter(item => item.tailorId.equals(tailorObjectId) && item.accepted === "null")
        .map(item => item.productId)
    );

    const uniqueProductsMap = new Map();
    products.forEach(product => {
      uniqueProductsMap.set(product._id.toString(), product);
    });
    const uniqueProducts = Array.from(uniqueProductsMap.values());

    res.status(200).json({ products: uniqueProducts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getAcceptedOrders = async (req, res) => {
  try {
    const tailorId = req.params.tailorId;
    if (!tailorId) return res.status(400).json({ message: "Tailor ID is required" });

    const tailorObjectId = new mongoose.Types.ObjectId(tailorId);

    const orders = await Order.find({
      items: {
        $elemMatch: {
          tailorId: tailorObjectId,
          accepted: "true"
        }
      }
    }).populate('items.productId');

    if (!orders.length) return res.status(204).json({ message: "No orders found" });

   
    const products = orders.flatMap(order =>
      order.items
        .filter(item => item.tailorId.equals(tailorObjectId) && item.accepted === "true")
        .map(item => item.productId)
    );

    const uniqueProductsMap = new Map();
    products.forEach(product => {
      uniqueProductsMap.set(product._id.toString(), product);
    });
    const uniqueProducts = Array.from(uniqueProductsMap.values());

    res.status(200).json({ products: uniqueProducts });
  }
   catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const OrderAccept = async (req, res) => {
  try {
    const { orderId, tailorId } = req.params;

    if (!orderId || !tailorId) 
    {
      return res.status(400).json({ message: "Order ID and Tailor ID are required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(204).json({ message: "Order not found" });
    }

    const tailorObjectId = new mongoose.Types.ObjectId(tailorId);

    
    let isUpdated = false;
    order.items = order.items.map(item => {
      if (item.tailorId.equals(tailorObjectId)) {
        item.accepted = "true";
        isUpdated = true;
      }
      return item;
    });

    if (!isUpdated) {
      return res.status(400).json({ message: "No matching item found for this tailor" });
    }

    await order.save();

    const tailor = await Tailor.findOne({ tailorId: tailorObjectId });
    if (!tailor) {
      return res.status(204).json({ message: "Tailor not found" });
    }

    if (!Array.isArray(tailor.acceptedOrders)) {
      tailor.acceptedOrders = [];
    }

    if (!tailor.acceptedOrders.map(id => id.toString()).includes(order._id.toString())) {
      tailor.acceptedOrders.push(order._id);
      await tailor.save();
    }

    res.status(200).json({ message: "Order accepted by tailor" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const OrderReject = async (req, res) => {
  try 
  {
    const { orderId, tailorId } = req.params;

    if (!orderId || !tailorId) {
      return res.status(400).json({ message: "Order ID and Tailor ID are required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(204).json({ message: "Order not found" });
    }

    const tailorObjectId = new mongoose.Types.ObjectId(tailorId);

   
    let isUpdated = false;
    order.items = order.items.map(item => {
      if (item.tailorId.equals(tailorObjectId)) {
        item.accepted = "false";
        isUpdated = true;
      }
      return item;
    });

    if (!isUpdated) {
      return res.status(400).json({ message: "No matching item found for this tailor" });
    }

    await order.save();
    res.status(200).json({ message: "Order not accepted by tailor" });

  } 
  catch (error) 
  {
    res.status(500).json({ message: error.message });
  }
};
  


const markAsCompleted= async (req, res) => {
  try {
    const tailorId = req.params.tailorId;
    if (!tailorId) return res.status(400).json({ message: "Tailor ID is required" });

    const tailorObjectId = new mongoose.Types.ObjectId(tailorId);

   
    const orders = await Order.find({
      
      items: {
        $elemMatch: {
          tailorId: tailorObjectId,
          status: "pending", 
          accepted: "true"
        }
      }
    });

    if (!orders.length) return res.status(404).json({ message: "No pending orders found" });

    
    await Promise.all(
      orders.map(async (order) => {
        order.items.status = "completed";
        await order.save();
      })
    );

    res.status(200).json({ message: `${orders.length} orders updated to completed.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getOrderSummary = async (req, res) => {
  try {
    const tailorId = req.params.tailorId;
    if (!tailorId) {
      return res.status(400).json({ message: "Tailor ID is required" });
    }
    
    const tailorObjectId = new mongoose.Types.ObjectId(tailorId);

    // Find orders that have at least one item matching the tailor and accepted true.
    const orders = await Order.find({
      items: { $elemMatch: { tailorId: tailorObjectId, accepted: "true" } }
    });

    let totalOrdersCount = 0;
    let completedOrdersCount = 0;
    let pendingOrdersCount = 0;

    // Iterate over each order and its items to count the orders.
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.tailorId.equals(tailorObjectId) && item.accepted === "true") {
          totalOrdersCount++;
          if (item.status === "completed") {
            completedOrdersCount++;
          } else if (item.status === "pending") {
            pendingOrdersCount++;
          }
        }
      });
    });

    // Return zero for any missing data.
    return res.status(200).json({
      totalOrders: totalOrdersCount || 0,
      completedOrdersCount: completedOrdersCount || 0,
      pendingOrdersCount: pendingOrdersCount || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



module.exports={showAllOrders,getAcceptedOrders,OrderAccept,OrderReject,markAsCompleted , getOrderSummary};
