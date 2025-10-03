import { getUserByEmail } from "@/components/auth/user";
import { LoginSchema } from "@/components/auth/validation";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import { env } from "@/env.mjs";

// Debug logging for environment variables
console.log('=====================================');
console.log('🔧 [Auth Config] INITIALIZING');
console.log('=====================================');
console.log({
  GOOGLE_CLIENT_ID: !!env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_ID_LENGTH: env.GOOGLE_CLIENT_ID?.length || 0,
  GOOGLE_CLIENT_SECRET: !!env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CLIENT_SECRET_LENGTH: env.GOOGLE_CLIENT_SECRET?.length || 0,
  FACEBOOK_CLIENT_ID: !!env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: !!env.FACEBOOK_CLIENT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  AUTH_SECRET: !!process.env.AUTH_SECRET,
  timestamp: new Date().toISOString()
});

// Build providers array dynamically based on available credentials
const providers = [];

// Add Google provider if credentials exist
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  console.log('✅ [Auth Config] Google OAuth is configured and will be added');
  providers.push(
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      profile(profile) {
        console.log('🔍 [Google OAuth] Profile received:', {
          sub: profile.sub,
          name: profile.name,
          email: profile.email,
          email_verified: profile.email_verified,
          picture: profile.picture,
          locale: profile.locale,
          timestamp: new Date().toISOString()
        });

        return {
          id: profile.sub,
          username: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: new Date(),
        };
      },
      checks: [], // Disable PKCE temporarily
    })
  );
} else {
  console.error('❌ [Auth Config] Google OAuth is NOT configured!', {
    hasClientId: !!env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!env.GOOGLE_CLIENT_SECRET,
    hint: 'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables'
  });
}

// Add Facebook provider if credentials exist
if (env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) {
  console.log('✅ [Auth Config] Facebook OAuth is configured and will be added');
  providers.push(
    Facebook({
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'email',
        }
      },
      profile(profile) {
        console.log('🔍 [Facebook OAuth] Profile received:', {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          timestamp: new Date().toISOString()
        });

        return {
          id: profile.id,
          username: profile.name || "Facebook User",
          email: profile.email || `${profile.id}@facebook.com`,
          image: profile.picture?.data?.url || null,
          emailVerified: new Date(),
        };
      },
      checks: [], // Disable PKCE temporarily
    })
  );
} else {
  console.log('⚠️ [Auth Config] Facebook OAuth is not configured');
}

// Always add Credentials provider
providers.push(
  Credentials({
    async authorize(credentials) {
      console.log('🔐 [Credentials] Login attempt');
      const validatedFields = LoginSchema.safeParse(credentials);

      if (validatedFields.success) {
        const { email, password } = validatedFields.data;

        const user = await getUserByEmail(email);
        if (!user || !user.password) {
          console.log('❌ [Credentials] User not found or no password set');
          return null;
        }

        const passwordsMatch = await bcrypt.compare(
          password,
          user.password,
        );

        if (passwordsMatch) {
          console.log('✅ [Credentials] Login successful for:', email);
          return user;
        } else {
          console.log('❌ [Credentials] Invalid password for:', email);
        }
      } else {
        console.log('❌ [Credentials] Invalid login fields');
      }

      return null;
    }
  })
);

// Log final provider configuration
console.log('📋 [Auth Config] Final provider configuration:', {
  totalProviders: providers.length,
  hasGoogle: providers.some(p => p.name === 'Google'),
  hasFacebook: providers.some(p => p.name === 'Facebook'),
  hasCredentials: providers.some(p => p.name === 'Credentials'),
});

// Check critical configuration
if (!process.env.AUTH_SECRET) {
  console.error('🚨 [Auth Config] CRITICAL: AUTH_SECRET is not set!');
  console.error('This will cause authentication to fail. Please set AUTH_SECRET in your environment variables.');
}

if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV === 'production') {
  console.error('🚨 [Auth Config] CRITICAL: NEXTAUTH_URL is not set in production!');
  console.error('This may cause OAuth callbacks to fail. Please set NEXTAUTH_URL to your production URL.');
}

export default {
  providers,
  trustHost: true, // Trust the host header for OAuth redirects
} satisfies NextAuthConfig;