const axios = require("axios"); 
const Cart = require("../models/Cart");
const mongoose = require("mongoose");
const Product = require("../models/productModel");

const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const productId = req.params.productId;
    const { quantity, tailorId, size } = req.body;

    console.log(req.body);
    
    if (typeof quantity !== "number" || quantity <= 0) {
      return res.status(400).json({ message: "Invalid or missing quantity" });
    }
    if (!tailorId) {
      return res.status(400).json({ message: "Invalid or missing tailorId" });
    }
    if (!size || typeof size !== "string") {
      return res.status(400).json({ message: "Invalid or missing size" });
    }
    let product;
    try {
      product = await Product.findById(productId);
      if (!product) {
        return res.status(204).json({ message: "Product not found" });
      }
    } catch (error) {
      return res.status(400).json({
        message: "Invalid product ID or Product Service is unavailable",
      });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [], totalPrice: 0 });
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId.toString() &&
        item.tailorId.toString() === tailorId.toString()
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId,
        quantity,
        price: product.price,
        tailorId,
        size,
      });
    }

    cart.totalPrice = cart.items.reduce((sum, item) => {
      const itemQuantity =
        typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 0;
      const itemPrice =
        typeof item.price === "number" && item.price > 0 ? item.price : 0;
      return sum + itemQuantity * itemPrice;
    }, 0);

    await cart.save();
    res.status(200).json({ message: "Item added to cart", cart });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ error });
  }
};

  


const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.userId; 
        const  productId  = req.params.productId; 

        let cart = await Cart.findOne({ userId });
        if (!cart) return res.status(204).json({ message: "Cart not found" });

        
        const initialItemCount = cart.items.length;
        cart.items = cart.items.filter(item => 
            !(item.productId.toString() === productId.toString())
        );

        if (cart.items.length === initialItemCount) 
        {
            return res.status(204).json({ message: "Product not found in cart" });
        }

        
        cart.totalPrice = cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
        await cart.save();

        res.status(200).json({ message: "Item removed", cart });
    } catch (error) {
        console.error("Remove from cart error:", error.message);
        res.status(500).json({ error: "Something went wrong" });
    }
};

const clearCart = async (userId) => {
    try{
      if (!userId){

          return { status: 400, message: "User ID is required" };
      }
        await Cart.findOneAndDelete({ userId });

        return { status: 200, message: "Cart cleared successfully" };
    } 
    catch (error) 
    {
        return { status: 500, error: "Something went wrong" };
    }
};


const getCart = async (req,res) => {
  try {
    const userId=req.user.userId;
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) 
    {
      return res.status(200).json({ message: "Cart is empty", items: [] });
    }

    
    const productIds = cart.items.map(item => item.productId);
    
    
    const products = await Product.find({ _id: { $in: productIds } }).select("name image");
    
    
    const productMap = {};
    products.forEach(product => {
      productMap[product._id.toString()] = {
        name: product.name,
        image: product.image
      };
    });
    
    
    const itemsWithName = cart.items.map(item => ({
      ...item.toObject(),
      name: productMap[item.productId.toString()]?.name || "Unknown Product",
      image: productMap[item.productId.toString()]?.image || null
    }));
    
    
    return res.status(200).json({ ...cart.toObject(), items: itemsWithName });
  } catch (error) {
    console.error("Get cart error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
};


const adjustQuantity = async (req, res) => 
{
  try {
    const userId = req.user.userId;
    const productId = req.params.productId;
    const { action } = req.body;

    if (!["increment", "decrement"].includes(action)) 
    {
      return res.status(400).json({ message: "Action must be increment or decrement" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(item => item.productId.toString() === productId.toString());

    if (!item) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    if (action === "increment") 
    {
      item.quantity += 1;
    }
     else if (action === "decrement") {
      item.quantity = Math.max(1, item.quantity - 1);
    }


    cart.totalPrice = cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    await cart.save();
    return res.status(200).json({ message: "Quantity adjusted", cart });

  } 
  
  catch (error) {
    console.error("Adjust quantity error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = { addToCart, removeFromCart, clearCart, getCart,adjustQuantity};
