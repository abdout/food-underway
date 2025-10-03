import { NextResponse } from "next/server";

export async function GET() {
  // Only enable in development for security
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Debug endpoint disabled in production' }, { status: 403 });
  }

  const config = {
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      VERCEL_URL: process.env.VERCEL_URL,
    },
    google: {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
      clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 10) || 'not-set',
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      clientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
      expectedCallbackUrl: `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/api/auth/callback/google`,
    },
    auth: {
      hasAuthSecret: !!process.env.AUTH_SECRET,
      authSecretLength: process.env.AUTH_SECRET?.length || 0,
    },
    facebook: {
      hasClientId: !!process.env.FACEBOOK_CLIENT_ID,
      hasClientSecret: !!process.env.FACEBOOK_CLIENT_SECRET,
    },
    debugging: {
      allEnvKeys: Object.keys(process.env).filter(key =>
        key.includes('AUTH') ||
        key.includes('GOOGLE') ||
        key.includes('FACEBOOK') ||
        key.includes('NEXTAUTH') ||
        key.includes('VERCEL_URL')
      ),
    }
  };

  console.log('🔍 [Debug OAuth] Configuration check:', config);

  return NextResponse.json(config, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}