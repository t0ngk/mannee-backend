import express from "express";
import isLogin from "../libs/middlewares/isLogin";
import prisma from "../libs/prisma";
import { z } from "zod";
import { AuthRequest } from "../libs/types/AuthRequest";
import isOwner from "../libs/middlewares/subscription/isOwner";

const router = express.Router();

const newBillSchema = z.object({
  name: z.string(),
  color: z.string(),
});

const newItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  color: z.string(),
});

router.get("/", isLogin, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: {
      username: req.user.username,
    },
    select: {
      bills: true,
    },
  });
  res.json({ ...user.bills });
});

router.get("/:id", isLogin, async (req: AuthRequest, res) => {
  const id = req.params.id;
  const user = await prisma.user.findUnique({
    where: {
      username: req.user.username,
    },
    select: {
      bills: {
        where: {
          id: id,
        },
      },
    },
  });
  if (!user) {
    res.status(404).json({ message: "Bill not found" });
    return;
  }
  res.json({ ...user.bills[0] });
});

router.post("/new", isLogin, async (req: AuthRequest, res) => {
  const validated = newBillSchema.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ message: "Invalid body" });
    return;
  }
  const { name, color } = validated.data;
  const bill = await prisma.bill.create({
    data: {
      name,
      color,
      ownerId: req.user.id,
      user: {
        connect: {
          username: req.user.username,
        },
      },
    },
  });
  if (!bill) {
    res.status(500).json({ message: "Internal server error" });
    return;
  }
  res.json({ ...bill });
});

router.delete("/:id", isLogin, async (req: AuthRequest, res) => {
  const id = req.params.id;
  const bill = await prisma.bill.delete({
    where: {
      id: id,
    },
  });
  if (!bill) {
    res.status(404).json({ message: "Bill not found" });
    return;
  }
  res.json({ ...bill });
});

router.put("/:id", isLogin, async (req: AuthRequest, res) => {
  const id = req.params.id;
  const validated = newBillSchema.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ message: "Invalid body" });
    return;
  }
  const { name, color, paidedId } = req.body;
  const reqMember = req.body.member;
  const member: {
    id: string;
  }[] = [
    {
      id: req.user.id,
    },
  ];
  if (reqMember && reqMember.length > 0) {
    reqMember.forEach((id) => {
      member.push({
        id,
      });
    });
  }
  const bill = await prisma.bill.update({
    where: {
      id: id,
    },
    data: {
      name,
      color,
      paidedId,
      user: {
        connect: member,
      },
    },
  });
  if (!bill) {
    res.status(404).json({ message: "Bill not found" });
    return;
  }
  res.json({ ...bill });
});

router.post("/:id/item/new" , isLogin, async (req: AuthRequest, res) => {
  const id = req.params.id;
  const validated = newItemSchema.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ message: "Invalid body" });
    return;
  }
  const { name, price, color, peopleId } = req.body;

  const item = await prisma.item.create({
    data: {
      name,
      price,
      color,
      peopleId,
      Bill: {
        connect: {
          id: id,
        },
      },
    },
  });
  if (!item) {
    res.status(500).json({ message: "Internal server error" });
    return;
  }
  res.json({ ...item });
});

router.delete("/:id/item/:itemId", isLogin, isOwner, async (req: AuthRequest, res) => {
  const itemId = req.params.itemId;
  const item = await prisma.item.delete({
    where: {
      id: itemId,
    },
  });
  if (!item) {
    res.status(404).json({ message: "Item not found" });
    return;
  }
  res.json({ ...item });
});

router.put("/:id/item/:itemId", isLogin, isOwner, async (req: AuthRequest, res) => {
  const itemId = req.params.itemId;
  const validated = newItemSchema.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ message: "Invalid body" });
    return;
  }
  const { name, price, color, peopleId } = req.body;
  const item = await prisma.item.update({
    where: {
      id: itemId,
    },
    data: {
      name,
      price,
      color,
      peopleId,
    },
  });
  if (!item) {
    res.status(404).json({ message: "Item not found" });
    return;
  }
  res.json({ ...item });
});



export default router;
