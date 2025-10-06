"use server";

import * as z from "zod";
import { AuthError } from "next-auth";
import { LoginSchema } from "@/components/auth/validation";
import { getUserByEmail } from "@/components/auth/user";
import { getTwoFactorTokenByEmail } from "@/components/auth/verification/2f-token";
import { sendTwoFactorTokenEmail, sendVerificationEmail } from "@/components/auth/mail";
import { generateTwoFactorToken, generateVerificationToken } from "@/components/auth/tokens";
import { getTwoFactorConfirmationByUserId } from "@/components/auth/verification/2f-confirmation";
import { db } from "@/lib/db";
import { signIn } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const login = async (
  values: z.infer<typeof LoginSchema>,
  callbackUrl?: string | null,
) => {
  console.log('=====================================');
  console.log('🔐 [LOGIN ACTION] START');
  console.log('=====================================');
  console.log('📋 Login parameters:', {
    hasEmail: !!values.email,
    hasPassword: !!values.password,
    callbackUrl,
    timestamp: new Date().toISOString()
  });

  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    console.log('❌ [LOGIN ACTION] Validation failed:', validatedFields.error);
    return { error: "Invalid fields!" };
  }

  const { email, password, code } = validatedFields.data;

  console.log('✅ [LOGIN ACTION] Fields validated for email:', email);

  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    return { error: "Email does not exist!" }
  }

  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(
      existingUser.email,
    );

    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token,
    );

    return { success: "Confirmation email sent!" };
  }

  if (existingUser.isTwoFactorEnabled && existingUser.email) {
    if (code) {
      const twoFactorToken = await getTwoFactorTokenByEmail(
        existingUser.email
      );

      if (!twoFactorToken) {
        return { error: "Invalid code!" };
      }

      if (twoFactorToken.token !== code) {
        return { error: "Invalid code!" };
      }

      const hasExpired = new Date(twoFactorToken.expires) < new Date();

      if (hasExpired) {
        return { error: "Code expired!" };
      }

      await db.twoFactorToken.delete({
        where: { id: twoFactorToken.id }
      });

      const existingConfirmation = await getTwoFactorConfirmationByUserId(
        existingUser.id
      );

      if (existingConfirmation) {
        await db.twoFactorConfirmation.delete({
          where: { id: existingConfirmation.id }
        });
      }

      await db.twoFactorConfirmation.create({
        data: {
          userId: existingUser.id,
        }
      });
    } else {
      const twoFactorToken = await generateTwoFactorToken(existingUser.email)
      await sendTwoFactorTokenEmail(
        twoFactorToken.email,
        twoFactorToken.token,
      );

      return { twoFactor: true };
    }
  }

  try {
    console.log('🔑 [LOGIN ACTION] Attempting signIn with credentials');
    console.log('📍 [LOGIN ACTION] Redirect configuration:', {
      hasCallbackUrl: !!callbackUrl,
      callbackUrl: callbackUrl,
      willUseDefaultRedirect: !callbackUrl,
      defaultRedirect: DEFAULT_LOGIN_REDIRECT
    });

    // Don't specify redirectTo - let auth.ts redirect callback handle the redirect based on user state
    // The redirect callback will check merchantId and redirect appropriately:
    // - No merchantId -> /onboarding
    // - PLATFORM_ADMIN -> /dashboard (operator)
    // - Has merchantId -> subdomain dashboard
    await signIn("credentials", {
      email,
      password,
      // Only use callbackUrl if explicitly provided (e.g., from "Get Started" button)
      ...(callbackUrl ? { redirectTo: callbackUrl } : {}),
    })

    console.log('✅ [LOGIN ACTION] signIn completed successfully');
    console.log('=====================================');
    console.log('🔐 [LOGIN ACTION] END');
    console.log('=====================================');
  } catch (error) {
    console.log('❌ [LOGIN ACTION] Error during signIn:', error);
    console.log('=====================================');
    console.log('🔐 [LOGIN ACTION] END (ERROR)');
    console.log('=====================================');

    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" }
        default:
          return { error: "Something went wrong!" }
      }
    }

    throw error;
  }
};
