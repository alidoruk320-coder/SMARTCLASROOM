import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3).max(20).trim(),
  email: z.email(),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

export const roomCodeSchema = z.object({
  roomCode: z.string().trim().min(4).max(8).toUpperCase(),
});
