import express from "express";
import isLogin from "../libs/middlewares/isLogin";
import prisma from "../libs/prisma";
import { z } from "zod";
import { AuthRequest } from "../libs/types/AuthRequest";
import isOwner from "../libs/middlewares/subscription/isOwner";

const router = express.Router();

const newSubscriptionSchema = z.object({
  icon: z.string(),
  currency: z.string(),
  price: z.number(),
  name: z.string(),
  color: z.string(),
  firstBill: z.string(),
  cycle: z.enum(["MONTHLY", "YEARLY", "WEEKLY", "DAILY"]),
  cycleFreq: z.number(),
});

router.get("/", isLogin, async (req: AuthRequest, res) => {
  // const user = await prisma.user.findUnique({
  //   where: {
  //     username: req.user.username,
  //   },
  //   select: {
  //     subscriptions: true,
  //   },
  // });
  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId: {
        has: req.user.id,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });
  console.log(subscriptions);
  res.json(subscriptions);
});

router.get("/:id", isLogin, async (req: AuthRequest, res) => {
  const id = req.params.id;
  const user = await prisma.user.findUnique({
    where: {
      username: req.user.username,
    },
    select: {
      subscriptions: {
        where: {
          id: id,
        },
      },
    },
  });
  if (!user) {
    res.status(404).json({ message: "Subscription not found" });
    return;
  }
  res.json(user.subscriptions[0]);
});

router.post("/new", isLogin, async (req: AuthRequest, res) => {
  const validated = newSubscriptionSchema.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ message: "Invalid body" });
    return;
  }
  const { icon, currency, price, name, color, firstBill, cycle, cycleFreq } =
    req.body;
  const reqMember: string[] | null = req.body.member;
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
  try {
    const subscription = await prisma.subscription.create({
      data: {
        icon,
        currency,
        price,
        name,
        color,
        firstBill,
        cycle,
        cycleFreq,
        ownerId: req.user.id,
        user: {
          connect: member,
        },
      },
    });
    if (!subscription) {
      res.status(500).json({ message: "Failed to create subscription" });
      return;
    }
    res.json({
      ...subscription,
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to create subscription" });
    return;
  }
});

router.put("/:id", isLogin, isOwner, async (req: AuthRequest, res) => {
  const id = req.params.id;
  const validated = newSubscriptionSchema.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ message: "Invalid body" });
    return;
  }
  const { icon, currency, price, name, color, firstBill, cycle, cycleFreq } =
    req.body;
  const reqMember: string[] | null = req.body.member;
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
  try {
    const subscription = await prisma.subscription.update({
      where: {
        id: id,
      },
      data: {
        icon,
        currency,
        price,
        name,
        color,
        firstBill,
        cycle,
        cycleFreq,
        user: {
          set: member,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      }
    });
    if (!subscription) {
      res.status(500).json({ message: "Failed to update subscription" });
      return;
    }
    res.json({
      ...subscription,
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to update subscription" });
    return;
  }
});

router.put("/:id/uncheckAll", isLogin, isOwner, async (req: AuthRequest, res) => {
  const id = req.params.id;
  const exit = await prisma.subscription.findFirst({
    where: {
      id:id
    }
  })
  if (!exit) {
    console.log("exit")
    res.status(404).json({ message: "Subscription not found" });
    return;
  }
  const subscription = await prisma.subscription.update({
    where: {
      id:id
    },
    data: {
      paidedId: []
    }
  })
  if (!subscription) {
    res.status(500).json({ message: "Failed to update subscription" });
    return;
  }
  res.json({
    ...subscription,
  });
})

router.put(
  "/:id/paid/:userId",
  isLogin,
  isOwner,
  async (req: AuthRequest, res) => {
    const id = req.params.id;
    const userId = req.params.userId;
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          id: id,
          userId: {
            has: userId,
          },
        },
      });
      const { paidedId } = subscription;
      const isPaided = paidedId.includes(userId);
      const newPaidedId = isPaided
        ? paidedId.filter((id) => id !== userId)
        : [...paidedId, userId];
      const newSubscription = await prisma.subscription.update({
        where: {
          id: id,
        },
        data: {
          paidedId: newPaidedId,
        },
      });
      if (!newSubscription) {
        res.status(500).json({ message: "Failed to update subscription" });
        return;
      }
      res.json({
        ...newSubscription,
      });
    } catch (e) {
      res.status(500).json({ message: "Failed to update subscription" });
      return;
    }
  }
);

router.delete("/:id", isLogin, isOwner, async (req: AuthRequest, res) => {
  const id = req.params.id;
  try {
    const subscription = await prisma.subscription.delete({
      where: {
        id: id,
      },
    });
    if (!subscription) {
      res.status(500).json({ message: "Failed to delete subscription" });
      return;
    }
    res.json({
      ...subscription,
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete subscription" });
    return;
  }
});

export default router;
