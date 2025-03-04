import { z } from "zod";

export const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const RegisterSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Contain at least 8 characters" })
    .regex(/[A-Z]/, {
      message: "Contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { message: "Contain at least one number" }),
  organisationName: z.string().min(1, "Organization name is required"),
});

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string(),
});

export const profileSchema = z.object({
  name: z
    .string()
    .min(1, "First name must be at least 1 characters")
    .optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z
    .string()
    .min(8, { message: "Contain at least 8 characters" })
    .regex(/[A-Z]/, { message: "Contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Contain at least one number" })
    .optional(),
  image: z.any().optional(),
});
