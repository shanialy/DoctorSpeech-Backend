import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import AuthConfig from "../config/authConfig";
import { CustomRequest, JwtPayload } from "../interfaces/auth/index";

export const checkAuth = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(410).json({ message: "UnAuthorized Request" });
  }

  // const token = tokenHeader && tokenHeader.split(" ")[1];

  jwt.verify(String(token), String(AuthConfig.JWT_SECRET), (err, decoded) => {
    if (err) {
      return res.status(410).json({ message: "Invalid Token" });
    }

    const decodedPayload = decoded as JwtPayload;
    req.userId = decodedPayload.id;
    req.email = decodedPayload.email;
    req.userType = decodedPayload.userType ? decodedPayload.userType : "";
    next();
  });
};
