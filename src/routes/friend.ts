import express from "express";
const router = express.Router();
import prisma from "../libs/prisma";
import { AuthRequest } from "../libs/types/AuthRequest";
import isLogin from "../libs/middlewares/isLogin";

router.get("/", isLogin, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: {
      username: req.user.username,
    },
    select: {
      friends: {
        select: {
          id: true,
          username: true
        }
      }
    }
  });
  res.json({ ...user.friends });
});

router.get("/request", isLogin, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: {
      username: req.user.username,
    },
    select: {
      friendRequestOf: {
        select: {
          id: true,
          username: true
        }
      }
    }
  });
  res.json({ ...user.friendRequestOf });
});

router.post("/add/:username", isLogin, async (req: AuthRequest, res) => {
  const { username } = req.params;
  const user = await prisma.user.findUnique({
    where: {
      username: req.user.username,
    },
    select: {
      friends: {
        select: {
          username: true
        }
      }
    }
  });
  const friend = await prisma.user.findUnique({
    where: {
      username
    }
  });
  if (!friend) {
    return res.status(404).json({
      message: "User not found"
    });
  }
  if (user.friends.find((f) => f.username === username)) {
    return res.status(400).json({
      message: "User already in your friend list"
    });
  }
  await prisma.user.update({
    where: {
      username: req.user.username
    },
    data: {
      friendRequest: {
        connect: {
          username
        }
      }
    }
  });
  res.json({
    message: "Friend added"
  });
});

router.post("/accept/:username", isLogin, async (req: AuthRequest, res) => {
  const { username } = req.params;
  const user = await prisma.user.findUnique({
    where: {
      username: req.user.username,
    },
    select: {
      friendRequestOf: {
        select: {
          username: true
        }
      }
    }
  });
  const friend = await prisma.user.findUnique({
    where: {
      username
    }
  });
  if (!friend) {
    return res.status(404).json({
      message: "User not found"
    });
  }
  if (!user.friendRequestOf.find((f) => f.username === username)) {
    return res.status(400).json({
      message: "User not in your friend request list"
    });
  }
  await prisma.user.update({
    where: {
      username: req.user.username
    },
    data: {
      friends: {
        connect: {
          username
        }
      },
      friendRequestOf: {
        disconnect: {
          username
        }
      }
    }
  });
  await prisma.user.update({
    where: {
      username
    },
    data: {
      friends: {
        connect: {
          username: req.user.username
        }
      }
    }
  });
  await prisma.user.update({
    where: {
      username
    },
    data: {
      friendRequest: {
        disconnect: {
          username: req.user.username
        }
      }
    }
  });
  await prisma.user.update({
    where: {
      username: req.user.username
    },
    data: {
      friendRequestOf: {
        disconnect: {
          username
        }
      }
    }
  });
  res.json({
    message: "Friend accepted"
  });
});

router.post("/reject/:username", isLogin, async (req: AuthRequest, res) => {
  const { username } = req.params;
  const user = await prisma.user.findUnique({
    where: {
      username: req.user.username,
    },
    select: {
      friendRequestOf: {
        select: {
          username: true
        }
      }
    }
  });
  const friend = await prisma.user.findUnique({
    where: {
      username
    }
  });
  if (!friend) {
    return res.status(404).json({
      message: "User not found"
    });
  }
  if (!user.friendRequestOf.find((f) => f.username === username)) {
    return res.status(400).json({
      message: "User not in your friend request list"
    });
  }
  await prisma.user.update({
    where: {
      username: req.user.username
    },
    data: {
      friendRequestOf: {
        disconnect: {
          username
        }
      }
    }
  });
  await prisma.user.update({
    where: {
      username
    },
    data: {
      friendRequest: {
        disconnect: {
          username: req.user.username
        }
      }
    }
  });
  res.json({
    message: "Friend rejected"
  });
});

export default router;
