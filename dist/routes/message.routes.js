"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Message_model_1 = __importDefault(require("../models/Message.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
/**
 * Middleware: Auth
 */
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
        return res.status(401).json({ message: "Unauthorized" });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "secret");
        req.userId = decoded.id;
        next();
    }
    catch {
        res.status(401).json({ message: "Invalid token" });
    }
};
/**
 * POST /api/messages/send
 * Send anonymous message
 */
// router.post("/send", authMiddleware, async (req: any, res) => {
//   try {
//     const { receiverId, text } = req.body;
//     if (!receiverId || !text) {
//       return res.status(400).json({ message: "All fields are required" });
//     }
//     const receiver = await User.findById(receiverId);
//     if (!receiver) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     const message = new Message({
//       receiver: receiverId,
//       text,
//       sender: null,
//       isAnonymous: true,
//     });
//     await message.save();
//     res.status(201).json({ message: "Message sent anonymously" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// });
router.post("/send", authMiddleware, async (req, res) => {
    try {
        const { receiverId, text, isAnonymous } = req.body;
        if (!receiverId || !text) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const receiver = await User_model_1.default.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: "User not found" });
        }
        const message = new Message_model_1.default({
            receiver: receiverId,
            text,
            sender: isAnonymous ? null : req.userId,
            isAnonymous: isAnonymous ?? true,
            isRead: false,
        });
        await message.save();
        res.status(201).json(message); // return the saved message
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
router.get("/inbox", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const messages = await Message_model_1.default.find({
            receiver: userId,
        })
            .sort({ createdAt: 1 }) // 👈 OLDEST → NEWEST
            .lean();
        const unreadCount = await Message_model_1.default.countDocuments({
            receiver: userId,
            isRead: false,
        });
        const result = messages.map((msg) => ({
            _id: msg._id,
            text: msg.text,
            createdAt: msg.createdAt,
            isAnonymous: msg.isAnonymous,
            sender: msg.sender,
        }));
        res.json(result);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to load inbox" });
    }
});
/**
 * GET /api/messages/thread/:userId
 * Fetch all messages for a specific user's conversation (everyone can see)
 */
router.get("/thread/:userId", authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params; // the user whose "conversation" is opened
        // Get all messages where receiver is this user OR messages sent by anyone about them
        const messages = await Message_model_1.default.find({
            receiver: userId
        }).sort({ createdAt: 1 });
        res.json(messages);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to load conversation" });
    }
});
exports.default = router;
