const Product=require('../models/productModel');

const createProduct = async (req, res) => {
    try {
        const { name, description, size, price, stock, category, image, gender } = req.body;
        
        if (!name || !price || !stock || !category || !image || !description || !size || !gender)
        {
            return res.status(400).json({ message: "All fields are required: name, description, size, price, stock, category, images (array), gender" });
        }
        
        if (!Array.isArray(image) || image.length < 2) 
        {
            return res.status(400).json({ error: "At least 2 image URLs are required." });
        }
        
        const allowedSizes = ["S", "M", "L", "XL", "XXL", "XXXL"];
        if (!Array.isArray(size) || size.length === 0 || !size.every(s => allowedSizes.includes(s)))
        {
            return res.status(400).json({ error: "Invalid sizes. Allowed values: S, M, L, XL, XXL, XXXL." });
        }
        
        if (!["male", "female"].includes(gender))
        {
            return res.status(400).json({ error: "Invalid gender. Allowed values: male, female." });
        }

        const product = new Product({ name, description, size, price, stock, category, image, gender });
        await product.save();
        
        res.status(201).json({ success: true, data: product });

    } 
    catch (error)
    {
        console.error("Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};


const getAllProducts=async(req,res) =>
{
    try
    {
        const products=await Product.find();
        res.status(200).json(
            {
                success:true,
                data:products
            }
        );
    }
    catch(error)
    {
        res.status(500).json({error:error.message});
    }
}

const getProductById=async(req,res) =>
{
    try
    {

    const id  = req.params.id;

    const product=await Product.findById(id);
    if(!product)  return res.status(204).json({messsage:"product not found"});
    res.status(200).json(
        {
            success:true,
            data:product
        }
    );
    }
    catch(error)
    {
        res.status(500).json({error:error.message});
    }
};

const updateProduct=async(req,res) =>
{
    try
    {
        const id  = req.params.id;
        const product=await Product.findByIdAndUpdate(id,req.body,{new:true});
        if(!product) return res.status(204).json({message:'product not found'});
        res.status(200).json({
            success:true,
            data:product
        });
    }
    catch(error) 
    {
        res.status(500).json({error:error.message});
    }
};

const deleteProduct=async(req,res) =>
{
    try
    {
        const id=req.params.id;
        //console.log(id);
        const product=await Product.findByIdAndDelete(id);
        //console.log(product);
        if(!product) return res.status(404).json({message:"product not found"});
        res.status(200).json({success:true,
            message:"product deleted succcessfully"});
    }
    catch(error)
    {
        res.status(500).json({error:error.message});
    }
};

const searchProductsByName = async (req, res) => {
    try {
        const { name } = req.query;
        const page = Number(req.query.page) || 1; 
        const limit = 5; 

        if (!name) {
            return res.status(400).json({ error: "Product name is required" });
        }

        const query = { name: { $regex: name, $options: "i" } };

        const totalProducts = await Product.countDocuments(query);
        const products = await Product.find(query)
            .limit(limit)  
            .skip((page - 1) * limit);

        res.status(200).json({
            success: true,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: page,
            totalProducts,
            data: products
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


module.exports={createProduct,getAllProducts,getProductById,updateProduct,deleteProduct,searchProductsByName};




