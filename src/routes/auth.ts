import express from "express";
import { z } from "zod";
import prisma from "../libs/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const router = express.Router();

const signupSchema = z.object({
  email: z.string().email(),
  username: z.string().min(4).max(100),
  password: z.string().min(6).max(100),
  confirmPassword: z.string().min(6).max(100),
});

router.post("/signup", async (req, res) => {
  const data = req.body;
  const validation = signupSchema.safeParse(data);
  if (!validation.success) {
    return res.status(400).json({ error: "Invalid request" });
  }
  const { email, username, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }
  const exitedUser = await prisma.user.findUnique({
    where: { username },
  });
  if (exitedUser) {
    return res.status(400).json({ error: "Username already exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: { email, username, password: hashedPassword },
  });
  if (!newUser) {
    return res.status(400).json({ error: "Error creating user" });
  }
  return res.json({
    message: "User created successfully",
  });
});

const loginSchema = z.object({
  username: z.string().min(4).max(100),
  password: z.string().min(6).max(100),
});

router.post("/signin", async (req, res) => {
  const data = req.body;
  const validation = loginSchema.safeParse(data);
  if (!validation.success) {
    return res.status(400).json({ error: "Invalid request" });
  }
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { username },
  });
  if (!user) {
    return res.status(400).json({ error: "Invalid username or password" });
  }
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ error: "Invalid username or password" });
  }
  const token = jwt.sign({ id: user.id }, 'supersecert');
  return res.json({
    token,
  });
});

router.get("/me", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { id } = jwt.verify(token, 'supersecert') as { id: string };
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, email: true, subscriptions: true, bills: true }
  });
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.json(user);
});

export default router;
