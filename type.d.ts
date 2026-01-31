import { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string; // now every request can have userId
  }
}
