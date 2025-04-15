const mongoose=require('mongoose');
const razorpay = require('../config/razorpay');
const PaymentSchema=new mongoose.Schema({

    userId:
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true

    },

    orderId:
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Order",
        required:true
    },
    razorpayOrderId:
    {
        type:String
    },
    razorpayPaymentId:
    {
        type:String
    },
    amount:
    {
        type:Number,
        require:true
    },
    currency:
    {
        type:String,
        default:"INR"
    },
    status:
    {
        type:String,
        enum:["pending","paid","failed"],
        default:"pending"
    }


})

module.exports=mongoose.model("Payment",PaymentSchema);