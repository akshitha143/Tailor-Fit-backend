const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {registerUser,verifyOTP,createProfile,loginUser,forgotPassword, resetPassword}=require('../controllers/authcontrollers');


router.post('/register', registerUser);
router.post('/verify-otp', authMiddleware, verifyOTP);
router.post('/create-profile', authMiddleware, createProfile);

router.post('/login', loginUser);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password',resetPassword);


module.exports = router; 
