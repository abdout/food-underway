import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import authConfig from "./auth.config"
import { DEFAULT_LOGIN_REDIRECT } from "@/routes"

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
    generateSessionToken: () => {
      const token = `session_${Date.now()}`;
      console.log('🔑 Generated session token:', token);
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/error",
  },
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log('🎉 SIGN IN EVENT:', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
        timestamp: new Date().toISOString()
      });
    },
  },
  cookies: {
    pkceCodeVerifier: {
      name: `authjs.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 900, // 15 minutes
        domain: process.env.NODE_ENV === "production" ? '.ed.databayt.org' : undefined,
      },
    },
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? '.ed.databayt.org' : undefined,
      },
    },
    callbackUrl: {
      name: `authjs.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? '.ed.databayt.org' : undefined,
      },
    },
    csrfToken: {
      name: `authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? '.ed.databayt.org' : undefined,
      },
    },
    // Add explicit configuration for all NextAuth cookies
    state: {
      name: `authjs.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? '.ed.databayt.org' : undefined,
      },
    },
    nonce: {
      name: `authjs.nonce`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? '.ed.databayt.org' : undefined,
      },
    },
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      console.log('🔐 JWT CALLBACK START:', { trigger, hasUser: !!user, hasAccount: !!account });
      
      if (user) {
        console.log('👤 User data received:', { 
          id: user.id, 
          email: user.email,
          hasRole: 'role' in user,
          hasSchoolId: 'schoolId' in user
        });
        
        token.id = user.id
        // Only set role and schoolId if they exist on the user object
        if ('role' in user) {
          token.role = (user as any).role
          console.log('🎭 Role set in token:', token.role);
        }
        if ('schoolId' in user) {
          token.schoolId = (user as any).schoolId
          console.log('🏫 SchoolId set in token:', token.schoolId);
        }
        
        // Ensure we have a proper session token
        if (account) {
          token.provider = account.provider
          token.providerAccountId = account.providerAccountId
          console.log('🔗 Account linked:', { provider: account.provider, id: account.providerAccountId });
        }
        
        // Force session update after OAuth
        if (trigger === 'signIn') {
          console.log('🔄 Forcing session update after signIn');
          token.iat = Math.floor(Date.now() / 1000);
          token.exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
          // Force session refresh by updating token
          token.sessionToken = `session_${Date.now()}`;
          // Force session update by changing a critical field
          token.updatedAt = Date.now();
          // Force session refresh by updating the token hash
          token.hash = `hash_${Date.now()}`;
        }
      }
      
      // Debug JWT state
      console.log('🔐 JWT CALLBACK END:', {
        tokenId: token?.id,
        hasRole: !!token?.role,
        hasSchoolId: !!token?.schoolId,
        provider: token?.provider,
        iat: token?.iat,
        exp: token?.exp,
        sub: token?.sub,
        sessionToken: token?.sessionToken
      });
      
      return token
    },
    async session({ session, token, user, trigger }) {
      console.log('📋 SESSION CALLBACK START:', { 
        trigger,
        hasToken: !!token, 
        hasUser: !!user,
        sessionUser: session.user?.id,
        timestamp: new Date().toISOString(),
        host: typeof window !== 'undefined' ? window.location.host : 'server'
      });
      
      if (token) {
        // Always ensure we have the latest token data
        session.user.id = token.id as string
        
        // Apply role and schoolId from token
        if (token.role) {
          (session.user as any).role = token.role
          console.log('🎭 Role applied to session:', token.role);
        }
        if (token.schoolId) {
          (session.user as any).schoolId = token.schoolId
          console.log('🏫 SchoolId applied to session:', token.schoolId);
        }
        
        // Force session update if token has been updated
        if (token.updatedAt) {
          console.log('🔄 Token updated, forcing session refresh');
          (session as any).updatedAt = token.updatedAt;
        }
        
        // Force session refresh if token hash changed
        if (token.hash) {
          console.log('🔄 Token hash changed, forcing session refresh');
          (session as any).hash = token.hash;
        }
        
        console.log('🔑 Token data applied to session:', {
          id: token.id,
          role: token.role,
          schoolId: token.schoolId
        });
      } else {
        console.log('⚠️ No token available in session callback');
      }
      
      // Debug session state
      console.log('📋 SESSION CALLBACK END:', {
        sessionId: session.user?.id,
        hasRole: !!(session.user as any)?.role,
        hasSchoolId: !!(session.user as any)?.schoolId,
        tokenId: token?.id,
        sessionToken: token?.sessionToken,
        iat: token?.iat,
        exp: token?.exp,
        email: session.user?.email,
        timestamp: new Date().toISOString()
      });
      
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log('🔄 REDIRECT CALLBACK START:', { url, baseUrl });
      
      // Extract host information from the callback URL which preserves the original domain
      let originalHost = '';
      try {
        // If url is a full URL, extract the host from it
        if (url.startsWith('http')) {
          const urlObj = new URL(url);
          originalHost = urlObj.host;
        } else {
          // If url is relative, use baseUrl
          const baseUrlObj = new URL(baseUrl);
          originalHost = baseUrlObj.host;
        }
        
        console.log('🔍 Host detection:', { originalHost, url, baseUrl });
        
        // Check if we're on a tenant subdomain (not ed.databayt.org)
        if (originalHost.endsWith('.databayt.org') && originalHost !== 'ed.databayt.org') {
          const subdomain = originalHost.split('.')[0];
          const tenantDashboardUrl = `https://${subdomain}.databayt.org/dashboard`;
          console.log('🔄 Tenant subdomain detected, redirecting to:', tenantDashboardUrl);
          return tenantDashboardUrl;
        }
      } catch (error) {
        console.log('❌ Error parsing URLs:', error);
        // Fall back to baseUrl parsing
        const baseUrlObj = new URL(baseUrl);
        originalHost = baseUrlObj.host;
      }
      
      // Extract tenant from callbackUrl if present - check multiple sources
      let tenant = null;
      
      // Method 1: Check URL searchParams
      try {
        const urlObj = new URL(url, baseUrl);
        tenant = urlObj.searchParams.get('tenant');
        console.log('🔍 Tenant from URL params:', { tenant, url: urlObj.href });
      } catch (error) {
        console.log('❌ Error parsing URL for tenant:', error);
      }
      
      // Method 2: Check if URL contains tenant info in path
      if (!tenant && url.includes('/callback/')) {
        const urlMatch = url.match(/tenant=([^&]+)/);
        if (urlMatch) {
          tenant = urlMatch[1];
          console.log('🔍 Tenant from URL regex match:', tenant);
        }
      }
      
      // Method 3: Check baseUrl for tenant info
      if (!tenant) {
        try {
          const baseUrlObj = new URL(baseUrl);
          tenant = baseUrlObj.searchParams.get('tenant');
          console.log('🔍 Tenant from baseUrl params:', { tenant, baseUrl });
        } catch (error) {
          console.log('❌ Error parsing baseUrl for tenant:', error);
        }
      }
      
      if (tenant) {
        // Redirect back to tenant subdomain
        const tenantUrl = process.env.NODE_ENV === "production" 
          ? `https://${tenant}.databayt.org/dashboard`
          : `http://${tenant}.localhost:3000/dashboard`;
        console.log('🔄 Redirecting to tenant via parameter:', { tenant, tenantUrl, originalUrl: url });
        return tenantUrl;
      }
      
      console.log('⚠️ No tenant parameter found in:', { url, baseUrl });
      
      // Handle Facebook redirect with #_=_ hash - clean it completely
      if (url.includes('#_=_')) {
        console.log('📘 Facebook redirect detected, cleaning hash');
        // Clean the Facebook hash and redirect appropriately
        const cleanUrl = url.replace(/#.*$/, '');
        console.log('🎯 Cleaned Facebook URL:', cleanUrl);
        
        // If we have tenant info, redirect to tenant dashboard
        if (tenant) {
          const tenantUrl = process.env.NODE_ENV === "production" 
            ? `https://${tenant}.databayt.org/dashboard`
            : `http://${tenant}.localhost:3000/dashboard`;
          console.log('🔄 Facebook: Redirecting to tenant after cleaning hash:', tenantUrl);
          return tenantUrl;
        }
        
        // Otherwise redirect to dashboard on current domain
        const dashboardUrl = `${baseUrl}/dashboard`;
        console.log('🔄 Facebook: Redirecting to dashboard after cleaning hash:', dashboardUrl);
        return dashboardUrl;
      }

      // Handle OAuth callback completion
      if (url.includes('/api/auth/callback/')) {
        console.log('🔄 OAuth callback detected, processing redirect');
        // Let the default behavior handle the redirect
        // The middleware will handle subdomain routing
      }

      // Log all redirect attempts for debugging
      console.log('🔄 Processing redirect:', { url, baseUrl });
      
      // Check if this is an error
      if (url.includes('/error')) {
        console.log('❌ Error page detected, investigating...');
      }

      // Default behavior - redirect to dashboard on current domain
      if (url.startsWith("/")) {
        const finalUrl = `${baseUrl}/dashboard`;
        console.log('🔄 Default behavior - redirecting to dashboard:', finalUrl);
        return finalUrl;
      }
      else if (new URL(url).origin === baseUrl) {
        // If it's the same origin, redirect to dashboard
        const dashboardUrl = `${baseUrl}/dashboard`;
        console.log('🔄 Same origin - redirecting to dashboard:', dashboardUrl);
        return dashboardUrl;
      }
      
      console.log('🔄 External URL - redirecting to dashboard:', `${baseUrl}/dashboard`);
      return `${baseUrl}/dashboard`
    },
  },
  ...authConfig,
})

// Debug logging for NextAuth initialization
console.log('NextAuth initialization - Environment check:', {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  AUTH_SECRET: !!process.env.AUTH_SECRET,
  GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
  FACEBOOK_CLIENT_ID: !!process.env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: !!process.env.FACEBOOK_CLIENT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
});

// Debug cookie configuration
console.log('🍪 Cookie configuration:', {
  pkceCodeVerifier: {
    name: 'authjs.pkce.code_verifier',
    options: { sameSite: 'lax', secure: false, httpOnly: true, maxAge: 900, domain: undefined }
  },
  sessionToken: {
    name: 'authjs.session-token',
    options: { sameSite: 'lax', secure: false, httpOnly: true, domain: undefined }
  },
  callbackUrl: {
    name: 'authjs.callback-url',
    options: { sameSite: 'lax', secure: false, domain: undefined }
  },
  csrfToken: {
    name: 'authjs.csrf-token',
    options: { sameSite: 'lax', secure: false, httpOnly: true, domain: undefined }
  }
});