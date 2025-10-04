import { getUserByEmail } from "@/components/auth/user";
import { LoginSchema } from "@/components/auth/validation";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
// Try to load from env.mjs first, fallback to process.env
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const facebookClientId = process.env.FACEBOOK_CLIENT_ID;
const facebookClientSecret = process.env.FACEBOOK_CLIENT_SECRET;

// Debug logging for environment variables
console.log('=====================================');
console.log('🔧 [Auth Config] INITIALIZING');
console.log('=====================================');
console.log({
  GOOGLE_CLIENT_ID: !!googleClientId,
  GOOGLE_CLIENT_ID_LENGTH: googleClientId?.length || 0,
  GOOGLE_CLIENT_ID_PREFIX: googleClientId?.substring(0, 20),
  GOOGLE_CLIENT_SECRET: !!googleClientSecret,
  GOOGLE_CLIENT_SECRET_LENGTH: googleClientSecret?.length || 0,
  FACEBOOK_CLIENT_ID: !!facebookClientId,
  FACEBOOK_CLIENT_SECRET: !!facebookClientSecret,
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  AUTH_SECRET: !!process.env.AUTH_SECRET,
  AUTH_SECRET_LENGTH: process.env.AUTH_SECRET?.length || 0,
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  timestamp: new Date().toISOString()
});

// Build providers array dynamically based on available credentials
const providers = [];

// Add Google provider if credentials exist
if (googleClientId && googleClientSecret) {
  console.log('✅ [Auth Config] Google OAuth is configured and will be added');
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
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
      }
    })
  );
} else {
  console.error('❌ [Auth Config] Google OAuth is NOT configured!', {
    hasClientId: !!googleClientId,
    hasClientSecret: !!googleClientSecret,
    clientIdValue: googleClientId?.substring(0, 20),
    hint: 'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables'
  });
}

// Add Facebook provider if credentials exist
if (facebookClientId && facebookClientSecret) {
  console.log('✅ [Auth Config] Facebook OAuth is configured and will be added');
  providers.push(
    Facebook({
      clientId: facebookClientId,
      clientSecret: facebookClientSecret,
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
      }
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
} else if (process.env.AUTH_SECRET === 'secret' || process.env.AUTH_SECRET.length < 32) {
  console.error('🚨 [Auth Config] CRITICAL: AUTH_SECRET appears to be invalid!');
  console.error(`AUTH_SECRET should be a random string at least 32 characters long. Current length: ${process.env.AUTH_SECRET.length}`);
  console.error('Generate a proper secret with: openssl rand -base64 32');
}

if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV === 'production') {
  console.error('🚨 [Auth Config] CRITICAL: NEXTAUTH_URL is not set in production!');
  console.error('This may cause OAuth callbacks to fail. Please set NEXTAUTH_URL to your production URL.');
}

export default {
  providers,
  trustHost: true, // Trust the host header for OAuth redirects
} satisfies NextAuthConfig;