import * as z from "zod";
import { UserRole } from "@prisma/client";

export const SettingsSchema = z.object({
  name: z.optional(z.string()),
  isTwoFactorEnabled: z.optional(z.boolean()),
  role: z.enum([UserRole.PLATFORM_ADMIN, UserRole.USER]),
  email: z.optional(z.string().email()),
  password: z.optional(z.string().min(6)),
  newPassword: z.optional(z.string().min(6)),
})
  .refine((data) => {
    if (data.password && !data.newPassword) {
      return false;
    }

    return true;
  }, {
    message: "New password is required!",
    path: ["newPassword"]
  })
  .refine((data) => {
    if (data.newPassword && !data.password) {
      return false;
    }

    return true;
  }, {
    message: "Password is required!",
    path: ["password"]
  })

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum of 6 characters required",
  }),
});

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
});

export const PhoneLoginSchema = z.object({
  phone: z.string()
    .min(9, {
      message: "Phone number must be at least 9 digits",
    })
    .regex(/^[0-9]+$/, {
      message: "Phone number must contain only digits",
    }),
  code: z.optional(z.string()), // For future OTP implementation
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
  code: z.optional(z.string()),
});

// Combined schema for flexible login (will be used in future phases)
export const FlexibleLoginSchema = z.discriminatedUnion('loginMethod', [
  z.object({
    loginMethod: z.literal('email'),
    email: z.string().email({
      message: "Email is required",
    }),
    password: z.string().min(1, {
      message: "Password is required",
    }),
    code: z.optional(z.string()),
  }),
  z.object({
    loginMethod: z.literal('phone'),
    phone: z.string()
      .min(9, {
        message: "Phone number must be at least 9 digits",
      })
      .regex(/^[0-9]+$/, {
        message: "Phone number must contain only digits",
      }),
    countryCode: z.string().default('+966'),
    code: z.optional(z.string()),
  }),
]);

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
  username: z.string().min(1, {
    message: "Username is required",
  }),
});
