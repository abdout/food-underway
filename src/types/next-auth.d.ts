import { UserRole } from "@prisma/client"
import NextAuth, { type DefaultSession } from "next-auth"

export type ExtendedUser = DefaultSession["user"] & {
  role: UserRole
  restaurantId?: string | null
  menuId?: string | null
  needsOnboarding?: boolean
  isTwoFactorEnabled: boolean
  isOAuth: boolean
  isPlatformAdmin: boolean
}

declare module "next-auth" {
  interface Session {
    user: ExtendedUser
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole
    restaurantId?: string | null
    menuId?: string | null
    needsOnboarding?: boolean
  }
}