"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_model_1 = __importDefault(require("../models/User.model")); // Make sure you have a User model
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Helper: upload to Cloudinary as a Promise
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.default.uploader.upload_stream({ folder: "profiles" }, (error, result) => {
            if (error || !result)
                return reject(error || new Error("Upload failed"));
            resolve(result.secure_url);
        });
        stream.end(fileBuffer);
    });
};
// POST /register
router.post("/register", upload.single("profilePic"), async (req, res) => {
    try {
        const { fullName, password } = req.body;
        // Validate inputs
        if (!fullName?.trim() || !password) {
            return res.status(400).json({ message: "Full name and password are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "Profile picture is required" });
        }
        // Check if user already exists
        const existingUser = await User_model_1.default.findOne({ fullName });
        if (existingUser) {
            return res.status(409).json({ message: "User with this name already exists" });
        }
        // Upload profile picture to Cloudinary
        const profilePicUrl = await uploadToCloudinary(req.file.buffer);
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Save user to DB
        const newUser = new User_model_1.default({
            fullName: fullName.trim(),
            password: hashedPassword,
            profilePic: profilePicUrl,
        });
        await newUser.save();
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: newUser._id }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
        // Return token and safe user info (never send password)
        return res.status(201).json({
            token,
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                profilePic: newUser.profilePic,
            },
        });
    }
    catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
