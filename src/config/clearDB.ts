import mongoose from "mongoose";
import UserModel from "../models/User.model";
import MessageModel from "../models/Message.model";


import * as dotenv from "dotenv";
dotenv.config();


async function clearDatabase() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI not found in env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // delete collections
    const userResult = await UserModel.deleteMany({});
    const messageResult = await MessageModel.deleteMany({});

    console.log(`🗑 Users deleted: ${userResult.deletedCount}`);
    console.log(`🗑 Messages deleted: ${messageResult.deletedCount}`);

    console.log("✅ Database cleared successfully");

  } catch (error) {
    console.error("❌ Error clearing database:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearDatabase();