"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const User_model_1 = __importDefault(require("../models/User.model"));
const Message_model_1 = __importDefault(require("../models/Message.model"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function clearDatabase() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not found in env");
        }
        await mongoose_1.default.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected");
        // delete collections
        const userResult = await User_model_1.default.deleteMany({});
        const messageResult = await Message_model_1.default.deleteMany({});
        console.log(`🗑 Users deleted: ${userResult.deletedCount}`);
        console.log(`🗑 Messages deleted: ${messageResult.deletedCount}`);
        console.log("✅ Database cleared successfully");
    }
    catch (error) {
        console.error("❌ Error clearing database:", error);
    }
    finally {
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
}
clearDatabase();
