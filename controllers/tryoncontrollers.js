const Clothes = require("../models/productModel");
const User = require("../models/User");
const multer = require("multer");
const Measurement = require('../models/measurements'); 
const fs = require("fs");
const path = require("path");
const mongoose = require('mongoose');

const getAllclothes = async (req, res) => {
  try {
    const gender = "male";
    const userId = req.user.userId; // from the JWT middleware, for instance
    console.log(req.user);
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    // Define the directory path based on userId
    const directoryPath = path.join(__dirname, "../uploads/photos", userId);

    // Check if the directory exists
    if (!fs.existsSync(directoryPath)) {
      return res.status(404).json({ message: "No clothes found for this user" });
    }

    // Read the directory and get all file names
    const files = fs.readdirSync(directoryPath);

    // Validate gender input
    if (gender !== "male" && gender !== "female") {
      return res.status(400).json({ message: "Invalid gender. Use 'male' or 'female'." });
    }

    // Fetch clothes based on gender
    const clothes = await Clothes.find({ gender });

    // Fetch user details using JWT user ID (for profile photo and glTF file)
    let userProfile = {};
    const userProfileData = await User.findById("67ed1b8cc3530ee4a7f936b8");
    if (userProfileData) {
      userProfile = {
        photo: userProfileData.profile?.photo || null,
        gltfFile: userProfileData.profile?.gltfFile || null,
      };
    }

    // Fetch the user using the ObjectId correctly by passing the id directly
    const foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Retrieve the measurement for the given user id
    const measurement = await Measurement.findOne({ user: userId });
    if (!measurement) {
      return res.status(404).json({ message: "Measurement not found" });
    }

    res.json({
      clothes,
      user: userProfile,
      userClothes: files,
      measurement,
    });
  } catch (error) {
    console.error('Error retrieving clothes:', error);
    res.status(500).json({ message: error.message });
  }
};


// Set storage engine for images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, "uploads/photos/");
    } else if (file.mimetype === "model/gltf+json") {
      cb(null, "uploads/gltf/");
    } else {
      cb(new Error("Invalid file type"), null);
    }
  },
  filename: function (req, file, cb) {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype === "model/gltf+json"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only images and GLTF files are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = { getAllclothes, upload };
