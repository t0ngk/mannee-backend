import jwt from "jsonwebtoken";
import prisma from "../prisma";

import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/AuthRequest";

const isLogin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    res.status(401).send("Token not found");
    return;
  }

  try {
    const decoded = jwt.verify(token, "supersecert");
    const user = await prisma.user.findUnique({
      where: {
        id: decoded["id"],
      },
      select: {
        id: true,
        username: true,
        email: true
      }
    });
    if (!user) {
      res.status(401).send("User not found");
      return;
    }
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send("Invalid token");
  }
};

export default isLogin;
