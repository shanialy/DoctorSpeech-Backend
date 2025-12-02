import { Request } from "express";

export interface CustomRequest extends Request {
  userId?: string;
  email?: string;
  userType?: string;
}
export interface CustomOptionalRequest extends Request {
  userId?: string | null;
  email?: string | null;
  userType?: string | null;
}

export interface JwtPayload {
  id: string;
  email: string;
  userType: string;
}
