

const Product=require('../models/productModel');

//add product
const createProduct = async (req, res) => {
    try {
        //console.log("Received Data:", req.body);  

        const { name, description, size, price, stock, category, image } = req.body;

        if (!name || !price || !stock || !category || !image || !description || !size) {
            return res.status(400).json({ message: "All fields are required: name, description, size, price, stock, category, image" });
        }

        if (!["S", "M", "L", "XL", "XXL", "XXXL"].includes(size)) {
            return res.status(400).json({ error: "Invalid size. Allowed values: S, M, L, XL, XXL, XXXL." });
        }

        const product = new Product(req.body);
        await product.save();
        res.status(201).json({ success: true, data: product });

    } catch (error) {
        console.error("Error:", error.message); 
        res.status(500).json({ error: error.message });
    }
};


//getAllProducts
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
    if(!product)  return res.status(404).json({messsage:"product not found"});
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
        if(!product) return res.status(404).json({message:'product not found'});
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
        const product=await Product.findByIdAndDelete(id);
        if(!product) return res.status(404).json({message:"product not found"});
        res.status(200).json({success:ture,
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




