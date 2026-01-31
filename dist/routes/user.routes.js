"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_model_1 = __importDefault(require("../models/User.model"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
/**
 * GET /api/users
 * Get all users except the logged-in user
 */
router.get("/", auth_middleware_1.protect, async (req, res) => {
    try {
        const users = await User_model_1.default.find({
            _id: { $ne: req.userId },
        }).select("-password");
        res.status(200).json(users);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch users" });
    }
});
exports.default = router;
