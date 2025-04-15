const mongoose = require("mongoose");

const TailorSchema = new mongoose.Schema({
  tailorId:
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, 
  },
  rating:{
    type:Number,
    default: 5
  },
  acceptedOrders: 
  [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default:[]
    },
  ],
});

module.exports = mongoose.model("Tailor", TailorSchema);
