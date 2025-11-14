import { Request } from "express";

export interface CustomRequest extends Request {
  userId?: string;
  email?: string;
  userType?: string;
}

export interface JwtPayload {
  id: string;
  email: string;
  userType: string;
}
