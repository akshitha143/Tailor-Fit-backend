const Tailor = require("../models/Tailor");
const Order = require("../models/Order");
const mongoose = require("mongoose");
const User=require("../models/User");

const showAllOrders = async (req, res) => {
  try {
    const { tailorId } = req.params;

    if (!tailorId) {
      return res.status(400).json({ message: "Tailor ID is required" });
    }

    const tailorObjectId = new mongoose.Types.ObjectId(tailorId);

   
    const orders = await Order.find({
      "items.tailorId": tailorObjectId
    }).populate("items.productId");

    if (!orders.length) {
      return res.status(204).json({ message: "No orders found for this tailor" });
    }

    const allProducts = orders.flatMap(order =>
      order.items
        .filter(item =>
          item.tailorId.equals(tailorObjectId) && item.accepted === "null"
        )
        .map(item => ({
          orderId: order._id,
          userId: order.userId,   
          product: item.productId,
          accepted: item.accepted
        }))
    );

    res.status(200).json({ tailorId: tailorId, products: allProducts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




const getAcceptedOrders = async (req, res) => {
  try {
    const tailorId = req.params.tailorId;
    if (!tailorId)
      return res.status(400).json({ message: "Tailor ID is required" });

    const tailorObjectId = new mongoose.Types.ObjectId(tailorId);

    const orders = await Order.find({
      items: {
        $elemMatch: {
          tailorId: tailorObjectId,
          accepted: "true",
          status: "Pending",
        },
      },
    }).populate("items.productId");

    if (!orders.length)
      return res.status(204).json({ message: "No orders found" });

    // Collect product info with userId and status
    const products = orders.flatMap((order) =>
      order.items
        .filter(
          (item) =>
            item.tailorId.equals(tailorObjectId) &&
            item.accepted === "true" &&
            item.status === "Pending"
        )
        .map((item) => ({
          ...item.productId._doc,
          userId: order.userId,
          status: item.status, // include the status field
        }))
    );

    // Deduplicate based on productId
    const uniqueProductsMap = new Map();
    products.forEach((product) => {
      uniqueProductsMap.set(product._id.toString(), product);
    });
    const uniqueProducts = Array.from(uniqueProductsMap.values());

    // Return the response with an additional "status" field in the JSON body.
    res.status(200).json({ status: "success", products: uniqueProducts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



const OrderAccept = async (req, res) => {
  try {
    const { orderId, tailorId, productId, userId } = req.body;
    // console.log(orderId);
    // console.log(tailorId);
    // console.log(productId);
    // console.log(userId);
    if (!orderId || !tailorId || !productId || !userId) {
      return res.status(400).json({ message: "Order ID, Tailor ID, Product ID, and User ID are required" });
    }

    const orderObjectId = new mongoose.Types.ObjectId(orderId);
    const tailorObjectId = new mongoose.Types.ObjectId(tailorId);
    const productObjectId = new mongoose.Types.ObjectId(productId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    
    const order = await Order.findOne({
      _id: orderObjectId,
      userId: userObjectId,
      "items.tailorId": tailorObjectId,
    });

    if (!order) 
    {
      return res.status(404).json({ message: "Order not found for this user and tailor" });
    }

    let isUpdated = false;

    order.items = order.items.map(item => {
      if (
        item.tailorId.equals(tailorObjectId) &&
        item.productId.equals(productObjectId)
      ) {
        item.accepted = "true";
        isUpdated = true;
      }
      return item;
    });

    if (!isUpdated) {
      return res.status(400).json({ message: "No matching item found for this tailor and product" });
    }

    await order.save();

    
    const tailor = await Tailor.findOne({ tailorId: tailorObjectId });
    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    if (!Array.isArray(tailor.acceptedOrders)) {
      tailor.acceptedOrders = [];
    }

    if (!tailor.acceptedOrders.map(id => id.toString()).includes(order._id.toString())) {
      tailor.acceptedOrders.push(order._id);
      await tailor.save();
    }

    res.status(200).json({ message: "Product accepted by tailor" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



const OrderReject = async (req, res) => {
  try {
    const { orderId, tailorId, productId, userId } = req.body;

    if (!orderId || !tailorId || !productId || !userId) {
      return res.status(400).json({ message: "Order ID, Tailor ID, Product ID, and User ID are required" });
    }

    const orderObjectId = new mongoose.Types.ObjectId(orderId);
    const tailorObjectId = new mongoose.Types.ObjectId(tailorId);
    const productObjectId = new mongoose.Types.ObjectId(productId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    
    const order = await Order.findOne({
      _id: orderObjectId,
      userId: userObjectId,
      "items.tailorId": tailorObjectId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found for this user and tailor" });
    }

    let isUpdated = false;

    order.items = order.items.map(item => {
      if (
        item.tailorId.equals(tailorObjectId) &&
        item.productId.equals(productObjectId)
      ) {
        item.accepted = "false";
        isUpdated = true;

      }
      return item;
    });

    if (!isUpdated) {
      return res.status(400).json({ message: "No matching item found for this tailor and product" });
    }

    await order.save();

    
    // const tailor = await Tailor.findOne({ tailorId: tailorObjectId });
    // if (!tailor) {
    //   return res.status(404).json({ message: "Tailor not found" });
    // }

    // if (!Array.isArray(tailor.acceptedOrders)) {
    //   tailor.acceptedOrders = [];
    // }

    // if (!tailor.acceptedOrders.map(id => id.toString()).includes(order._id.toString())) {
    //   tailor.acceptedOrders.push(order._id);
    //   await tailor.save();
    // }

    res.status(200).json({ message: "Product not accepted by tailor" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



const markAsCompleted = async (req, res) => {
  try {
    const { userId, tailorId, productId } = req.body;

   
    const user = new mongoose.Types.ObjectId(userId);
    const tailor = new mongoose.Types.ObjectId(tailorId);
    const product = new mongoose.Types.ObjectId(productId);

   
    const order = await Order.findOne({
      userId: user,
      items: {
        $elemMatch: {
          productId: product,
          tailorId: tailor,
          status: "Pending",// after payment implementation change into pending for checking purpose only i use Processing
          accepted: "true"
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: "No matching processing order found" });
    }

    let updatedItem = null;

   
    order.items.forEach(item => {
      if (
        item.productId.equals(product) &&
        item.tailorId.equals(tailor) &&
        item.status === "Pending" &&
        item.accepted === "true"
      ) {
        item.status = "Completed";
        updatedItem = item; 
      }
    });

    if (!updatedItem) {
      return res.status(400).json({ message: "Item status not updated" });
    }

    
    await order.save();

    
    res.status(200).json({ message: "Product marked as completed", updatedItem });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Internal Server Error" });
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
          if (item.status === "Completed") {
            completedOrdersCount++;
          } else if (item.status === "Pending") {
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


const tailorsInfo = async (req, res) => {
  try {
    
    const topTailors = await Tailor.find({ rating: { $gt: 4 } }).select("tailorId rating");

    if (!topTailors.length) {
      return res.status(204).json({ message: "No tailors found with rating above 4" });
    }


    const tailorData = await Promise.all(
      topTailors.map(async (tailor) => {
        const user = await User.findById(tailor.tailorId).select("_id email profile.name profile.phoneNumber profile.photo");

        if (!user) return null;

        return {
          tailorId: user._id,
          name: user.profile.name,
          email: user.email,
          phoneNumber: user.profile.phoneNumber,
          profile: user.profile.photo,
          rating: tailor.rating
        };
      })
    );

    const filteredTailors = tailorData.filter(t => t !== null);

    return res.status(200).json({ tailors: filteredTailors });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const  tailorsInfobyId = async (req , res )=>{
  try {
    const tailor = await Tailor.findOne({ tailorId: req.params.tailorId }).populate("tailorId");

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    res.status(200).json(tailor);
  } catch (error) {
    console.error("Error fetching tailor:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports={showAllOrders,getAcceptedOrders,OrderAccept,OrderReject,markAsCompleted , getOrderSummary,tailorsInfo, tailorsInfobyId};
