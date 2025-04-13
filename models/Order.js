const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    
    userId: 
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        accepted: {
          type: String,
          enum:["true", "false","null"],
          default: "null",
        },
        tailorId: 
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        status: {
          type: String,
          enum: ["Processing", "Cancelled", "Pending", "Completed"],
          default: "Processing",
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    totalOrders:
    {
      type:Number,
      default:0
    },

    completedOrders:
    {
      type:Number,
      default:0
    },

    pendingOrders:
    {
      type:Number,
      default:0
    },
    payment_status:
    {
      type:String,
      enum:["Paid","Unpaid"],
      default:"Unpaid"
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
