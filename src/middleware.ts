import { NextResponse, NextRequest } from "next/server";
import { authRoutes, publicRoutes, apiAuthPrefix } from "@/routes";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { i18n, type Locale } from "@/components/internationalization/config";
import { logger, generateRequestId } from "@/lib/logger";
import { addSecurityHeaders } from "@/middleware/security-headers";

// Helper function to apply security headers to response
function applySecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  return addSecurityHeaders(request, response);
}

// Helper function to get locale from request
function getLocale(request: NextRequest): Locale {
  // 1. Check cookie first for user preference - this represents user's explicit choice
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && i18n.locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  // 2. For new users without a cookie, always use the default locale (Arabic)
  // We're not checking Accept-Language header to ensure Arabic is truly the default
  // This makes the site Arabic-first for all new visitors
  return i18n.defaultLocale;
}

// Helper function to strip locale from pathname
function stripLocaleFromPathname(pathname: string): string {
  for (const locale of i18n.locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return pathname.replace(`/${locale}`, '') || '/';
    }
  }
  return pathname;
}

export async function middleware(req: NextRequest) {
  // Generate requestId for this request
  const requestId = generateRequestId();

  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";
  const userAgent = req.headers.get("user-agent") || "";
  const referer = req.headers.get("referer") || "";

  // Create base logging context
  const baseContext = { requestId, host, pathname: url.pathname };

  // Ignore static files and Next internals
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith(apiAuthPrefix) ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|ico|svg|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  // Check if pathname already has a locale
  const pathnameHasLocale = i18n.locales.some(
    (locale) => url.pathname.startsWith(`/${locale}/`) || url.pathname === `/${locale}`
  );

  // Handle root path - redirect to locale-prefixed path
  if (url.pathname === '/') {
    const locale = getLocale(req);
    const response = NextResponse.redirect(new URL(`/${locale}`, req.url));
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // Get the current locale from the path or detect it
  let currentLocale: Locale = i18n.defaultLocale;
  if (pathnameHasLocale) {
    currentLocale = url.pathname.split('/')[1] as Locale;
  } else {
    currentLocale = getLocale(req);
  }

  // Get pathname without locale for route checking
  const pathnameWithoutLocale = stripLocaleFromPathname(url.pathname);

  // Get session for authentication check
  const session = await auth();
  const isLoggedIn = !!session?.user;

  // Enhanced debug logging for OAuth and auth flow
  console.log('=====================================');
  console.log('🚦 [Middleware] REQUEST INTERCEPTED');
  console.log('=====================================');
  console.log({
    requestId,
    host,
    pathname: url.pathname,
    pathnameWithoutLocale,
    currentLocale,
    search: url.search,
    searchParams: Object.fromEntries(url.searchParams.entries()),
    referer,
    isBot: userAgent.includes('bot'),
    isLoggedIn,
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    merchantId: session?.user?.merchantId,
    isAuthRoute: authRoutes.includes(pathnameWithoutLocale),
    isPublicRoute: publicRoutes.includes(pathnameWithoutLocale),
    isApiAuthRoute: url.pathname.startsWith(apiAuthPrefix),
    cookies: req.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })),
    timestamp: new Date().toISOString()
  });

  // Special OAuth callback logging
  if (url.pathname.includes('/api/auth/callback/')) {
    const provider = url.pathname.match(/callback\/(\w+)/)?.[1];
    console.log('🔐 [Middleware] OAUTH CALLBACK DETECTED:', {
      provider,
      hasCode: url.searchParams.has('code'),
      hasState: url.searchParams.has('state'),
      hasError: url.searchParams.has('error'),
      errorDescription: url.searchParams.get('error_description'),
      allParams: Array.from(url.searchParams.keys()),
      host,
      fullUrl: url.toString()
    });
  }

  // Debug logging for subdomain handling
  logger.debug('MIDDLEWARE REQUEST', {
    ...baseContext,
    pathnameWithoutLocale,
    currentLocale,
    search: url.search,
    referer,
    isBot: userAgent.includes('bot'),
    userId: session?.user?.id,
    merchantId: session?.user?.merchantId
  });

  // Allow auth routes to be handled normally (don't rewrite for subdomains)
  if (authRoutes.includes(pathnameWithoutLocale)) {
    logger.debug('AUTH ROUTE - No rewrite', { ...baseContext, pathname: pathnameWithoutLocale });

    // Add locale to auth routes if not present
    if (!pathnameHasLocale) {
      url.pathname = `/${currentLocale}${pathnameWithoutLocale}`;
      const response = NextResponse.redirect(url);
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    return response;
  }

  const isPublicRoute = publicRoutes.includes(pathnameWithoutLocale);
  const isOnboardingRoute = pathnameWithoutLocale.startsWith('/onboarding');
  const isDocsRoute = pathnameWithoutLocale.startsWith('/docs');
  const isDashboardRoute = pathnameWithoutLocale.startsWith('/dashboard');

  // Check if user needs onboarding (new merchant owner without merchant)
  const needsOnboarding = session?.user && !session.user.merchantId && session.user.role !== 'PLATFORM_ADMIN';

  // Redirect to login if accessing protected routes without authentication
  if (!isLoggedIn && !isPublicRoute && !isDocsRoute) {
    const callbackUrl = url.pathname + url.search;
    logger.info('UNAUTHORIZED ACCESS - Redirecting to login', {
      ...baseContext,
      pathnameWithoutLocale,
      isLoggedIn,
      isPublicRoute,
      isDocsRoute,
      callbackUrl
    });

    const loginUrl = new URL(`/${currentLocale}/login`, req.url);
    // Preserve the full path including pathname
    loginUrl.searchParams.set('callbackUrl', callbackUrl);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // Redirect to onboarding if user needs it and trying to access dashboard
  if (isLoggedIn && needsOnboarding && isDashboardRoute && !isOnboardingRoute) {
    logger.info('USER NEEDS ONBOARDING - Redirecting to merchant setup', {
      ...baseContext,
      userId: session?.user?.id,
      hasMerchant: !!session?.user?.merchantId
    });

    const onboardingUrl = new URL(`/${currentLocale}/onboarding`, req.url);
    const response = NextResponse.redirect(onboardingUrl);
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // Block non-admin users from accessing operator routes
  const isOperatorRoute = pathnameWithoutLocale.startsWith('/dashboard') &&
                         !url.pathname.includes('/s/'); // Not a subdomain route

  if (isLoggedIn && isOperatorRoute) {
    const userRole = (session?.user as any)?.role;

    if (userRole !== 'PLATFORM_ADMIN') {
      logger.warn('UNAUTHORIZED OPERATOR ACCESS ATTEMPT', {
        ...baseContext,
        userId: session?.user?.id,
        userRole,
        attemptedPath: pathnameWithoutLocale
      });

      const userMerchantId = (session?.user as any)?.merchantId;

      // Redirect to appropriate destination
      if (!userMerchantId) {
        const onboardingUrl = new URL(`/${currentLocale}/onboarding`, req.url);
        const response = NextResponse.redirect(onboardingUrl);
        response.headers.set('x-request-id', requestId);
        return response;
      }

      // Fetch user's merchant subdomain and redirect
      try {
        const merchant = await db.merchant.findUnique({
          where: { id: userMerchantId },
          select: { subdomain: true }
        });

        if (merchant?.subdomain) {
          const tenantDashboard = process.env.NODE_ENV === 'production'
            ? `https://${merchant.subdomain}.databayt.org/dashboard`
            : `http://${merchant.subdomain}.localhost:3000/dashboard`;

          const response = NextResponse.redirect(new URL(tenantDashboard));
          response.headers.set('x-request-id', requestId);
          return response;
        }
      } catch (error) {
        logger.error('Error fetching merchant for redirect', { error, userId: session?.user?.id });
      }

      // Fallback: redirect to home
      const homeUrl = new URL(`/${currentLocale}`, req.url);
      const response = NextResponse.redirect(homeUrl);
      response.headers.set('x-request-id', requestId);
      return response;
    }
  }

  // If user is logged in and accessing auth routes, check if there's a callback URL
  if (isLoggedIn && authRoutes.includes(pathnameWithoutLocale)) {
    console.log('=====================================');
    console.log('🔐 [MIDDLEWARE] LOGGED IN USER ON AUTH ROUTE');
    console.log('=====================================');
    console.log('📍 Route info:', {
      pathname: pathnameWithoutLocale,
      fullUrl: url.toString(),
      userId: session?.user?.id,
      userRole: (session?.user as any)?.role,
      merchantId: (session?.user as any)?.merchantId
    });

    // Check if there's a callback URL parameter that should be respected
    const callbackUrl = url.searchParams.get('callbackUrl');

    console.log('🔍 [MIDDLEWARE] Callback URL check:', {
      hasCallbackUrl: !!callbackUrl,
      callbackUrl: callbackUrl,
      allSearchParams: Object.fromEntries(url.searchParams.entries())
    });

    if (callbackUrl) {
      logger.debug('ALREADY LOGGED IN - Redirecting to callback URL', {
        ...baseContext,
        pathnameWithoutLocale,
        callbackUrl,
        userId: session?.user?.id
      });

      console.log('✅ [MIDDLEWARE] Redirecting to callback URL:', callbackUrl);

      // Redirect to the callback URL instead of dashboard
      const response = NextResponse.redirect(new URL(callbackUrl, req.url));
      response.headers.set('x-request-id', requestId);
      return response;
    }
    
    // If no callback URL, determine redirect based on user role and onboarding status
    const userRole = (session?.user as any)?.role;
    const userMerchantId = (session?.user as any)?.merchantId;
    const userNeedsOnboarding = session?.user && !userMerchantId && userRole !== 'PLATFORM_ADMIN';

    console.log('🔍 [MIDDLEWARE] User status:', {
      userRole,
      userMerchantId,
      userNeedsOnboarding,
      isPlatformAdmin: userRole === 'PLATFORM_ADMIN'
    });

    if (userRole === 'PLATFORM_ADMIN') {
      // PLATFORM_ADMINs go to the operator dashboard
      console.log('👑 [MIDDLEWARE] PLATFORM_ADMIN detected - redirecting to operator dashboard');
      logger.debug('PLATFORM_ADMIN LOGGED IN - Redirecting to operator dashboard', {
        ...baseContext,
        userId: session?.user?.id,
        userRole
      });
      const redirectUrl = `/${currentLocale}/dashboard`;
      console.log('✅ [MIDDLEWARE] Redirect URL:', redirectUrl);
      const response = NextResponse.redirect(new URL(redirectUrl, req.url));
      response.headers.set('x-request-id', requestId);
      return response;
    } else if (userNeedsOnboarding) {
      // Non-admin users who need onboarding go to the onboarding page
      console.log('🚀 [MIDDLEWARE] User needs onboarding - redirecting to onboarding page');
      logger.debug('USER NEEDS ONBOARDING - Redirecting to onboarding', {
        ...baseContext,
        userId: session?.user?.id,
        userRole,
        userMerchantId
      });
      const onboardingUrl = new URL(`/${currentLocale}/onboarding`, req.url);
      console.log('✅ [MIDDLEWARE] Redirect URL:', onboardingUrl.toString());
      const response = NextResponse.redirect(onboardingUrl);
      response.headers.set('x-request-id', requestId);
      return response;
    } else if (userMerchantId) {
      // Users who have completed onboarding and have a merchantId
      // Redirect them to their specific subdomain dashboard
      logger.debug('TENANT USER LOGGED IN - Redirecting to subdomain dashboard', {
        ...baseContext,
        userId: session?.user?.id,
        userRole,
        userMerchantId
      });

      try {
        const merchant = await db.merchant.findUnique({
          where: { id: userMerchantId },
          select: { subdomain: true },
        });

        if (merchant?.subdomain) {
          const tenantDashboardUrl = process.env.NODE_ENV === "production"
            ? `https://${merchant.subdomain}.databayt.org/dashboard`
            : `http://${merchant.subdomain}.localhost:3000/dashboard`;

          logger.info('🚀 Redirecting to tenant subdomain dashboard', { tenantDashboardUrl, userMerchantId });
          const response = NextResponse.redirect(new URL(tenantDashboardUrl));
          response.headers.set('x-request-id', requestId);
          return response;
        } else {
          logger.warn('⚠️ Merchant found but no subdomain defined, redirecting to onboarding', { userMerchantId });
          const onboardingUrl = new URL(`/${currentLocale}/onboarding`, req.url);
          const response = NextResponse.redirect(onboardingUrl);
          response.headers.set('x-request-id', requestId);
          return response;
        }
      } catch (error) {
        logger.error('❌ Error fetching merchant subdomain', { error, userId: session?.user?.id });
        // Fallback to onboarding if error occurs
        const onboardingUrl = new URL(`/${currentLocale}/onboarding`, req.url);
        const response = NextResponse.redirect(onboardingUrl);
        response.headers.set('x-request-id', requestId);
        return response;
      }
    } else {
      // Fallback for any other logged-in user without a specific role or merchantId to a safe default
      logger.debug('UNHANDLED LOGGED IN USER - Redirecting to home page (fallback)', {
        ...baseContext,
        userId: session?.user?.id,
        userRole,
        userMerchantId
      });
      const response = NextResponse.redirect(new URL(`/${currentLocale}`, req.url)); // Redirect to home page or a generic logged-in landing
      response.headers.set('x-request-id', requestId);
      return response;
    }
  }

  // Case 1: Main marketing domain (me.databayt.org) - handle i18n for marketing pages
  const isMarketingDomain = host === "me.databayt.org" ||
                           host === "localhost:3000" ||
                           host === "localhost";

  // Always redirect ed.databayt.org to me.databayt.org (permanent migration)
  if (host === "ed.databayt.org") {
    const newUrl = new URL(req.url);
    newUrl.host = "me.databayt.org";
    logger.info('PERMANENT REDIRECT from ed.databayt.org to me.databayt.org', {
      ...baseContext,
      oldHost: host,
      newHost: "me.databayt.org"
    });
    const response = NextResponse.redirect(newUrl, 301);
    response.headers.set('x-request-id', requestId);
    return response;
  }

  if (isMarketingDomain) {
    logger.debug('MAIN DOMAIN - Marketing routes with i18n', { ...baseContext, currentLocale, host });

    // If locale is not in URL, redirect to include it
    if (!pathnameHasLocale) {
      url.pathname = `/${currentLocale}${url.pathname}`;
      const response = NextResponse.redirect(url);

      // Set cookie for future visits
      response.cookies.set('NEXT_LOCALE', currentLocale, {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      response.headers.set('x-request-id', requestId);
      return response;
    }

    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // For subdomain handling, we need to handle locale + subdomain rewriting
  let subdomain: string | null = null;

  // Case 2: Production subdomains (*.databayt.org)
  if (host.endsWith(".databayt.org") && !host.startsWith("me.")) {
    subdomain = host.split(".")[0];
    logger.debug('PRODUCTION TENANT', { ...baseContext, subdomain });
  }

  // Case 3: Vercel preview URLs (tenant---branch.vercel.app)
  else if (host.includes("---") && host.endsWith(".vercel.app")) {
    subdomain = host.split("---")[0];
    logger.debug('VERCEL TENANT', { ...baseContext, subdomain });
  }

  // Case 4: localhost development with subdomain
  else if (host.includes("localhost") && host.includes(".")) {
    const parts = host.split(".");
    if (parts.length > 1 && parts[0] !== "www" && parts[0] !== "localhost") {
      subdomain = parts[0];
      logger.debug('DEVELOPMENT TENANT', { ...baseContext, subdomain });
    }
  }

  // If we have a subdomain, handle tenant routing with i18n
  if (subdomain) {
    logger.debug('TENANT REWRITE WITH I18N', {
      ...baseContext,
      subdomain,
      originalPath: url.pathname,
      currentLocale,
      pathnameHasLocale
    });

    // If locale is not in URL, redirect to include it
    if (!pathnameHasLocale) {
      url.pathname = `/${currentLocale}${url.pathname}`;
      const response = NextResponse.redirect(url);

      // Set cookie for future visits
      response.cookies.set('NEXT_LOCALE', currentLocale, {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      response.headers.set('x-request-id', requestId);
      return response;
    }

    // Rewrite to include subdomain in path: /[locale]/s/[subdomain]/...
    // Remove the locale temporarily, add subdomain path, then re-add locale
    const pathWithoutLocale = stripLocaleFromPathname(url.pathname);
    url.pathname = `/${currentLocale}/s/${subdomain}${pathWithoutLocale}`;

    logger.debug('FINAL REWRITE PATH', {
      ...baseContext,
      newPath: url.pathname,
      locale: currentLocale,
      subdomain,
      pathWithoutLocale
    });

    const response = NextResponse.rewrite(url);
    response.headers.set('x-request-id', requestId);
    return response;
  }

  logger.debug('NO SPECIAL HANDLING - Default behavior', baseContext);

  // For main domain without locale, add it
  if (!pathnameHasLocale) {
    url.pathname = `/${currentLocale}${url.pathname}`;
    const response = NextResponse.redirect(url);

    // Set cookie for future visits
    response.cookies.set('NEXT_LOCALE', currentLocale, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    // Add requestId to response headers
    response.headers.set('x-request-id', requestId);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);
  return applySecurityHeaders(response, req);
}

export const config = {
  matcher: ["/((?!_next/|.*\\..*).*)"],
};