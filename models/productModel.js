const mongoose=require('mongoose');
const productSchema=new mongoose.Schema({
    name:
    {
        type:String,
        required:true
    },
    description:
    {
        type:String,
        required:true
    },
    size: { 
        type: [String], 
        required: true, 
        enum: ["S", "M", "L", "XL", "XXL", "XXXL"] 
    },
    
    price:
    {
        type:Number,
        required:true 
    },
    stock:
    {
        type:Number,
        required:true,
        default:0
    },
    category:
    {
        type:String,
        required:true
    },
    image:
    {
        type:[String],
        required:true
    },
    gender :{
        type: String,
        required: true,
        enum: ["male", "female"]
    },
});
module.exports=mongoose.model('Product',productSchema);