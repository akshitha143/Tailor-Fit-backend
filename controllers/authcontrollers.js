const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const admin = require("../config/firebase");
const User = require("../models/User");
const { generateOTP, sendOTPEmail } = require("../utils/otpService");

const registerUser = async (req, res) => 
{
  const { email, password, confirmPassword, username } = req.body;

  if (password !== confirmPassword) 
    {
      return res.status(400).json({ message: "Passwords do not match" });
    }
  
  try {
      let firebaseUser;
  
      try 
      {

          firebaseUser = await admin.auth().getUserByEmail(email);
          return res.status(400).json({ message: "Email already in use" });
      } 
      catch (error) 
      {
          if (error.code !== "auth/user-not-found") {
              return res.status(204).json({ message: "Error checking Firebase user", error: error.message });
          }
      }
  
      firebaseUser = await admin.auth().createUser({
          email: email,
          password: password,
      });
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
  
      const user = new User({
          email,
          username, 
          password: hashedPassword,
          otp,
          otpExpires,
          firebaseUid: firebaseUser.uid,
      });
  
      await user.save();
  
      await sendOTPEmail(email, otp);
    //   print(otp)
  
      const token = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
      );
  
      res.status(201).json({ message: "OTP sent for verification", token });
  
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};


const verifyOTP = async (req, res) => {
    const { otp } = req.body;
    const email = req.user.email;

    try {
        const user = await User.findOne({ email });
        if (!user || user.otp !== otp || new Date() > user.otpExpires)
            return res.status(400).json({ message: "Invalid or expired OTP" });

        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.json({ message: "Email verified successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createProfile = async (req, res) => 
  {
  const { name, phoneNumber, address, photo, dob, gender,usertype } = req.body;
  if(!["customer","tailor"].includes(usertype))
  {
    return res.status(400).json({ message: "Invalid user type" });
  }

  const email = req.user.email;


  try {
  
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      if (!user.isVerified) 
          return res.status(400).json({ message: "Email not verified. Complete OTP verification first." });

      
      const formattedDob = new Date(dob);
      if (isNaN(formattedDob)) {
          return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
      }

      user.usertype = usertype;
      user.profile = { name, phoneNumber, address, photo, dob: formattedDob, gender};
      await user.save();

      res.json({ message: "Profile updated successfully", id:user._id,profile:user.profile });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => 
  {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
        const token=jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
      );

        res.status(200).json({ message: "Login successful",id:user._id,token: token, userprofile:user.profile,useremail:user.email,usertype:user.usertype});
    }
    catch (error) 
    {
        res.status(500).json({message: error.message});
    }
};

const forgotPassword = async (req, res) => 
{
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();

        await sendOTPEmail(email, otp);

        res.status(200).json({ message: "OTP sent for password reset" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const resetPassword = async (req, res) => {
    const { otp, newPassword,email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || user.otp !== otp || new Date() > user.otpExpires)
            return res.status(400).json({ message: "Invalid or expired OTP" });

        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = null;
        user.otpExpires = null;
        await user.save();

       

        res.json({ message: "Password reset successfully" });
    } 
    catch (error) 
    {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, verifyOTP, createProfile, loginUser, forgotPassword, resetPassword };
