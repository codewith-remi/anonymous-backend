"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = __importDefault(require("../models/User.model"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() }); // keep files in memory
// Helper: Upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.default.uploader.upload_stream({ folder: "profiles" }, (error, result) => {
            if (error || !result)
                reject(error);
            else
                resolve(result.secure_url);
        });
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
        const user = await User_model_1.default.findOne({ fullName });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
        res.json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                profilePic: user.profilePic,
            },
        });
    }
    catch (error) {
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
        const existingUser = await User_model_1.default.findOne({ fullName });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        // Upload image to Cloudinary
        const profilePicUrl = await uploadToCloudinary(file.buffer);
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Save user to MongoDB
        const newUser = new User_model_1.default({
            fullName,
            password: hashedPassword,
            profilePic: profilePicUrl,
        });
        await newUser.save();
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: newUser._id }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
        res.status(201).json({
            token,
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                profilePic: newUser.profilePic,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
});
exports.default = router;
