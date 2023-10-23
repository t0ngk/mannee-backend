import prisma from "../../prisma";

import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types/AuthRequest";

const isAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const id = req.params.id;
  const user = req.user;
  const subscription = await prisma.subscription.findUnique({
    where: {
      id: id,
      userId: {
        has: user.id,
      },
    }
  });
  if (!subscription) {
    res
      .status(400)
      .json({ message: "You are not the owner of this subscription" });
    return;
  }
  next();
};

export default isAccess;
