import prisma from "../../prisma";

import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types/AuthRequest";

const isOwner = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const id = req.params.id;
  const user = req.user;
  const bill = await prisma.bill.findUnique({
    where: {
      id: id,
      ownerId: user.id,
    },
    select: {
      ownerId: true,
    },
  });
  if (!bill) {
    res
      .status(400)
      .json({ message: "You are not the owner of this bill" });
    return;
  }
  next();
};
