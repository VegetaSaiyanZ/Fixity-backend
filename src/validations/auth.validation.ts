import { z } from "zod";

// Contains Zod schemas to enforce strict shape, type, and length constraints on data coming into the Authentication endpoints (like Signup and Signin).
export const SignupSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const SigninSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const RefreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

export const SignoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

export type SignupDTO = z.infer<typeof SignupSchema>["body"];
export type SigninDTO = z.infer<typeof SigninSchema>["body"];
export type RefreshDTO = z.infer<typeof RefreshSchema>["body"];
export type SignoutDTO = z.infer<typeof SignoutSchema>["body"];
