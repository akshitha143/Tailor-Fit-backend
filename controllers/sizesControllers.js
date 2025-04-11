const mongoose = require('mongoose');
const Measurement = require('../models/measurements'); // Adjust the path as needed
const User = require('../models/User');
const { calculateShirtSize, calculatePantSize } = require("../utils/sizeChart");

const createMeasurement = async (req, res) => {
  try {
    const {
      user,
      height,
      neck,
      shoulder,
      chest,
      waist,
      hip,
      thigh,
      knee,
      ankle
    } = req.body;

    // Sanitize the user id and convert it to an ObjectId instance using `new`
    const userId = new mongoose.Types.ObjectId(
      user.toString().replace(/"/g, '').trim()
    );

    // Check that the user exists
    const foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!chest || !chest.circumference || !waist || !waist.circumference) {
      return res.status(400).json({ message: "Missing chest or waist circumference for size calculation." });
    }
    
    const shirtSize = calculateShirtSize(chest.circumference);
    const pantSize = calculatePantSize(waist.circumference);
    
    // Create a new measurement document with calculated sizes
    const newMeasurement = new Measurement({
      user: userId,
      height,
      neck,
      shoulder,
      chest,
      waist,
      hip,
      thigh,
      knee,
      ankle,
      shirtSize,
      pantSize
    });
    
    await newMeasurement.save();    

    return res.status(201).json({
      sizes: {
        shirtSize,
        pantSize
      }
    });
  } catch (error) {
    console.error('Error storing measurement:', error);
    return res.status(500).json({ message: error.message });
  }
};

const getmeasurement = async (req, res) => {
    try {
      // Hard-coded user id for demonstration purposes; in production, get this from req.user or similar.
    //   let user = "67f0dd315e59b73225ff9664";
    const user = req.user.userId;
      
      // Validate that the provided user id is a valid 24-character hex string
      if (!mongoose.Types.ObjectId.isValid(user)) {
        return res.status(400).json({ message: 'Invalid user id provided.' });
      }
  
      // Convert user id to ObjectId instance using new
      const userId = new mongoose.Types.ObjectId(user.toString().replace(/"/g, '').trim());
  
      // Fetch the user using the ObjectId
      const foundUser = await User.findById(userId);
      if (!foundUser) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Retrieve the measurement for the given user id
      const measurement = await Measurement.findOne({ user: userId });
      if (!measurement) {
        return res.status(404).json({ message: 'Measurement not found' });
      }
  
      return res.status(200).json(measurement);
    } catch (error) {
      console.error('Error retrieving measurement:', error);
      return res.status(500).json({ message: error.message });
    }
  };
  

module.exports = { createMeasurement, getmeasurement };
