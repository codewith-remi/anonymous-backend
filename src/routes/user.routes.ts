import express from "express";
import User from "../models/User.model";
import { AuthRequest, protect } from "../middlewares/auth.middleware";

const router = express.Router();

/**
 * GET /api/users
 * Get all users except the logged-in user
 */
router.get("/", protect, async (req: AuthRequest, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.userId },
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

export default router;
