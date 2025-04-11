const express=require('express');
const router=express.Router();
const {getAllclothes, upload }=require('../controllers/tryoncontrollers');
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");



// Upload user photo
router.post("/upload/photo", authMiddleware, upload.single("photo"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const user = await User.findById("67ed1b8cc3530ee4a7f936b8");
        if (!user) return res.status(404).json({ message: "User not found" });

        user.profile.photo = req.file.path;
        await user.save();

        res.json({ message: "Photo uploaded successfully", photo: req.file.path });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Upload user GLTF file
router.post("/upload/gltf", authMiddleware, upload.single("gltfFile"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const user = await User.findById("67ed1b8cc3530ee4a7f936b8");
        console.log(req.user.id);
        
        if (!user) return res.status(404).json({ message: "User not found" });

        user.profile.gltfFile = req.file.path;
        await user.save();

        res.json({ message: "GLTF file uploaded successfully", gltfFile: req.file.path });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.get('/getallclothes',authMiddleware,getAllclothes);
module.exports=router;
