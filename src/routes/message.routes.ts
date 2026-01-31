  import express from "express";
  import Message from "../models/Message.model";
  import User from "../models/User.model";
  import jwt from "jsonwebtoken";

  const router = express.Router();

  /**
   * Middleware: Auth
   */
  const authMiddleware = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret"
      );
      req.userId = decoded.id;
      next();
    } catch {
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



  router.post("/send", authMiddleware, async (req: any, res) => {
    try {
      const { receiverId, text, isAnonymous } = req.body;
  
      if (!receiverId || !text) {
        return res.status(400).json({ message: "All fields are required" });
      }
  
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const message = new Message({
        receiver: receiverId,
        text,
        sender: isAnonymous ? null : req.userId, 
        isAnonymous: isAnonymous ?? true,        
        isRead: false,
      });
  
      await message.save();
  
      res.status(201).json(message); // return the saved message
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });




  router.get("/inbox", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.userId;
  
      const messages = await Message.find({
        receiver: userId,
      })
        .sort({ createdAt: 1 }) // 👈 OLDEST → NEWEST
        .lean();

      const unreadCount = await Message.countDocuments({
        receiver: userId,
        isRead: false,
      });
  
      const result = messages.map((msg: any) => ({
        _id: msg._id,
        text: msg.text,
        createdAt: msg.createdAt,
        isAnonymous: msg.isAnonymous,
        sender: msg.sender,
      }));
  
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to load inbox" });
    }
  });























  /**
   * GET /api/messages/thread/:userId
   * Fetch all messages for a specific user's conversation (everyone can see)
   */
  router.get("/thread/:userId", authMiddleware, async (req: any, res) => {
    try {
      const { userId } = req.params; // the user whose "conversation" is opened

      // Get all messages where receiver is this user OR messages sent by anyone about them
      const messages = await Message.find({
        receiver: userId
      }).sort({ createdAt: 1 });

      res.json(messages);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to load conversation" });
    }
  });






  export default router;
