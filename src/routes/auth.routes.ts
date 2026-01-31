import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model";
import cloudinary from "../config/cloudinary";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // keep files in memory

// Helper: Upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "profiles" },
      (error, result) => {
        if (error || !result) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { fullName, password } = req.body;

    if (!fullName || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ fullName });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

// POST /api/auth/register
router.post("/register", upload.single("profilePic"), async (req, res) => {
  try {
    const { fullName, password } = req.body;
    const file = req.file;

    if (!fullName || !password || !file) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ fullName });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Upload image to Cloudinary
    const profilePicUrl = await uploadToCloudinary(file.buffer);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to MongoDB
    const newUser = new User({
      fullName,
      password: hashedPassword,
      profilePic: profilePicUrl,
    });

    await newUser.save();

    // Generate JWT
    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        profilePic: newUser.profilePic,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
