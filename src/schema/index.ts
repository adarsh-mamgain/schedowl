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
  organisationName: z.string().min(1, "Organisation name is required"),
});

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string(),
});

export const ProfileSchema = z.object({
  name: z
    .string()
    .min(1, "First name must be at least 1 characters")
    .nullable(),
  email: z.string().email("Invalid email address").nullable(),
  password: z
    .string()
    .nullable()
    .refine(
      (val) => {
        // If password is not provided, it's valid
        if (!val) return true;

        // If password is provided, validate it
        return (
          val.length >= 8 &&
          /[A-Z]/.test(val) &&
          /[a-z]/.test(val) &&
          /[0-9]/.test(val)
        );
      },
      {
        message:
          "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number",
      }
    ),
  image: z.any().nullable(),
});

export const CreateSubscriptionSchema = z.object({
  billing: z.object({
    city: z.string().min(1, "City is required"),
    country: z.string().length(2, "Country must be 2 characters"),
    state: z.string().min(1, "State is required"),
    street: z.string().min(1, "Street is required"),
    zipcode: z.string().min(1, "Zipcode is required"),
  }),
  customer: z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(1, "Name is required"),
  }),
  product_id: z.string(),
  quantity: z.number().default(1),
  discount_code: z.string().nullable().optional(),
  metadata: z.record(z.string()).optional(),
  payment_link: z.boolean().default(true),
  return_url: z.string().nullable().optional(),
  tax_id: z.string().nullable().optional(),
  trial_period_days: z.number().min(0).max(10000).nullable().optional(),
});
