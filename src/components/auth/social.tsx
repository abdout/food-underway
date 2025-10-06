"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";


import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

// Function to clean Facebook URL hash
const cleanUrlHash = () => {
  // Only run on client side
  if (typeof window !== "undefined") {
    // Check if URL has the Facebook hash fragment
    if (window.location.hash === "#_=_") {
      // Clean the hash
      const cleanUrl = window.location.href.replace(/#.*$/, "");
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }
};

export const Social = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const tenant = searchParams.get("tenant");

  console.log('=====================================');
  console.log('🔐 [SOCIAL] Component Loaded');
  console.log('=====================================');
  console.log('📍 [SOCIAL] Location & Params:', {
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    href: typeof window !== 'undefined' ? window.location.href : 'server',
    pathname: typeof window !== 'undefined' ? window.location.pathname : 'server',
    search: typeof window !== 'undefined' ? window.location.search : 'server',
    callbackUrlFromParams: callbackUrl,
    tenantFromParams: tenant,
    allSearchParams: Object.fromEntries(searchParams.entries()),
    timestamp: new Date().toISOString()
  });
  console.log('=====================================\n');

  // Clean URL hash on component mount - this will handle Facebook redirects
  useEffect(() => {
    console.log('🔄 [SOCIAL] useEffect triggered - cleaning URL hash');
    cleanUrlHash();
    
    // Debug: Log component mount
    console.log('Social component mounted on:', {
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      href: window.location.href,
      callbackUrl
    });
    
    // Additional debug info
    console.log('Window location details:', {
      protocol: window.location.protocol,
      host: window.location.host,
      hostname: window.location.hostname,
      port: window.location.port,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      href: window.location.href
    });
    
    // Test if we're in a subdomain context
    const isSubdomain = window.location.hostname.includes('.localhost') && window.location.hostname !== 'localhost';
    console.log('Subdomain detection:', {
      hostname: window.location.hostname,
      isSubdomain,
      includesLocalhost: window.location.hostname.includes('.localhost'),
      notLocalhost: window.location.hostname !== 'localhost'
    });
  }, []);

  const onClick = async (provider: "google" | "facebook") => {
    console.log('\n\n\n=====================================');
    console.log(`🚀🚀🚀 [SOCIAL] GOOGLE BUTTON CLICKED! 🚀🚀🚀`);
    console.log(`🔐 OAuth Provider: ${provider.toUpperCase()}`);
    console.log('=====================================');
    
    // Ensure we're on client side
    if (typeof window === 'undefined') {
      console.log('❌ onClick called on server side, aborting');
      return;
    }
    
    // Log current page state
    console.log('📍 Current Page State:', {
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      searchParams: Object.fromEntries(new URLSearchParams(window.location.search).entries()),
      callbackUrlFromParams: callbackUrl,
      tenantFromParams: tenant
    });
    
    // Check if we're on a subdomain
    const currentHost = window.location.hostname;
    const isProdSubdomain = currentHost.endsWith('.databayt.org') && currentHost !== 'ed.databayt.org';
    const isDevSubdomain = currentHost.includes('.localhost') && currentHost !== 'localhost';
    const isSubdomain = isProdSubdomain || isDevSubdomain;
    
    console.log('🔍 Host detection debug:', {
      currentHost,
      isProdSubdomain,
      isDevSubdomain,
      isSubdomain,
      endsWithDatabayt: currentHost.endsWith('.databayt.org'),
      notEdDatabayt: currentHost !== 'ed.databayt.org'
    });
    
    console.log('🚀 OAUTH FLOW INITIATED:', {
      provider,
      currentHost,
      isSubdomain,
      callbackUrl,
      tenant,
      currentUrl: window.location.href
    });
    
    // Determine tenant - use subdomain detection or URL parameter
    let tenantSubdomain = null;
    
    if (isSubdomain) {
      tenantSubdomain = currentHost.split('.')[0];
      console.log('🎯 Tenant from subdomain detection:', tenantSubdomain);
    } else if (tenant) {
      tenantSubdomain = tenant;
      console.log('🎯 Tenant from URL parameter:', tenantSubdomain);
    }
    
    // If we have a tenant (either from subdomain or parameter), use custom OAuth flow
    if (tenantSubdomain) {
      // Detect locale from current page
      const locale = typeof window !== 'undefined'
        ? (window.location.pathname.match(/^\/(ar|en)(\/|$)/)?.[1] || 'ar')
        : 'ar';

      // Use appropriate URL based on environment with locale
      const dashboardUrl = process.env.NODE_ENV === 'production'
        ? `https://${tenantSubdomain}.databayt.org/${locale}/dashboard`
        : `http://${tenantSubdomain}.localhost:3000/${locale}/dashboard`;

      console.log('🔗 TENANT OAUTH INITIATED:', {
        tenantSubdomain,
        provider,
        dashboardUrl,
        locale,
        currentHost,
        environment: process.env.NODE_ENV,
        source: isSubdomain ? 'subdomain_detection' : 'url_parameter',
        isProdSubdomain,
        isDevSubdomain
      });

      // Store tenant info for fallback
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('oauth_tenant', tenantSubdomain);
        sessionStorage.setItem('oauth_callback_url', dashboardUrl);
        console.log('💾 Stored OAuth context:', {
          tenant: tenantSubdomain,
          callbackUrl: dashboardUrl
        });
      }

      signIn(provider, {
        callbackUrl: `${dashboardUrl}?tenant=${tenantSubdomain}`,
      });
      return;
    }
    
    // Default OAuth flow for main domain
    // IMPORTANT: Preserve the original callbackUrl from the login page
    // If no callbackUrl, use /ar/onboarding as default for new users (with locale)
    const locale = typeof window !== 'undefined'
      ? (window.location.pathname.match(/^\/(ar|en)(\/|$)/)?.[1] || 'ar')
      : 'ar';
    const finalCallbackUrl = callbackUrl || `/${locale}/onboarding`;

    console.log('\n🌐 MAIN DOMAIN OAUTH FLOW');
    console.log('📊 OAuth Configuration:', {
      provider,
      callbackUrl: finalCallbackUrl,
      originalCallbackUrl: callbackUrl,
      willUseOnboardingDefault: !callbackUrl,
      locale,
      currentHost,
      searchParamsString: searchParams.toString(),
      allSearchParams: Object.fromEntries(searchParams.entries())
    });
    
    // ALWAYS store the finalCallbackUrl (even if it's the default /ar/onboarding)
    // This ensures OAuth callback knows where to redirect
    console.log('\n💾 STORING CALLBACK URL...');
    console.log('📋 Storing:', finalCallbackUrl);

    // Store server-side via API (most reliable)
    try {
      console.log('📡 Calling store-callback API...');
      const response = await fetch('/api/auth/store-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callbackUrl: finalCallbackUrl })
      });

      const responseData = await response.json();
      console.log('📡 Store-callback API response:', {
        status: response.status,
        ok: response.ok,
        data: responseData,
        headers: {
          'content-type': response.headers.get('content-type'),
          'set-cookie': response.headers.get('set-cookie')
        }
      });

      if (response.ok) {
        console.log('✅ Callback URL stored server-side via API');
      } else {
        console.log('⚠️ Failed to store callback URL server-side:', responseData);
      }
    } catch (error) {
      console.log('❌ Error calling store-callback API:', error);
      console.log('Stack:', error instanceof Error ? error.stack : 'No stack');
    }

    // Also store client-side as backup
    if (typeof window !== 'undefined') {
      // Store in session storage
      if (window.sessionStorage) {
        sessionStorage.setItem('oauth_callback_intended', finalCallbackUrl);
        console.log('✅ Stored in session storage:', {
          key: 'oauth_callback_intended',
          value: finalCallbackUrl,
          verified: sessionStorage.getItem('oauth_callback_intended') === finalCallbackUrl
        });
      }

      // Store as a cookie with proper domain settings
      const cookieDomain = process.env.NODE_ENV === 'production' ? '.databayt.org' : '';
      const cookieString = `oauth_callback_intended=${encodeURIComponent(finalCallbackUrl)}; path=/; max-age=900; SameSite=Lax${cookieDomain ? `; Domain=${cookieDomain}` : ''}`;
      document.cookie = cookieString;
      console.log('🍪 Stored in client cookie:', {
        key: 'oauth_callback_intended',
        value: finalCallbackUrl,
        cookie: document.cookie.includes('oauth_callback_intended')
      });
    }
    
    console.log('\n🔐 CALLING NEXTAUTH SIGNIN...');
    console.log('📋 Final configuration:', {
      provider,
      callbackUrl: finalCallbackUrl,
      redirect: true,
      timestamp: new Date().toISOString()
    });
    
    // Check all storage mechanisms right before redirect
    console.log('🔍 Pre-redirect storage check:');
    if (typeof window !== 'undefined') {
      // Check sessionStorage
      console.log('  Session Storage:', {
        oauth_callback_intended: sessionStorage.getItem('oauth_callback_intended'),
        oauth_tenant: sessionStorage.getItem('oauth_tenant'),
        oauth_callback_url: sessionStorage.getItem('oauth_callback_url')
      });
      
      // Check cookies
      console.log('  Document cookies:', document.cookie.split(';').filter(c => 
        c.includes('oauth') || c.includes('callback')
      ));
    }
    
    // Try to ensure the callback URL is preserved
    // NextAuth might not properly pass callbackUrl through OAuth providers
    // So we'll try multiple approaches
    
    console.log('🚀 INITIATING OAUTH REDIRECT NOW...');
    
    // Approach 1: Standard NextAuth way with explicit redirect parameter
    // ALWAYS pass callbackUrl to ensure our redirect callback is used
    const signInOptions: any = {
      callbackUrl: finalCallbackUrl,
      redirect: true,
    };
    
    // For OAuth providers, also try to use the state parameter
    if (provider === 'google' || provider === 'facebook') {
      // Add state parameter to preserve callback through OAuth flow
      signInOptions.state = btoa(JSON.stringify({ 
        callbackUrl: finalCallbackUrl,
        timestamp: Date.now()
      }));
      console.log('📦 Added state parameter for OAuth:', signInOptions.state);
    }
    
    console.log('🎯 Final signIn options:', signInOptions);
    
    signIn(provider, signInOptions);
    
    console.log('✅ SignIn called - redirect should happen now');
    
    // Note: If the above doesn't work, we're also storing in cookie and sessionStorage
    // The redirect callback will check those as fallback
  }

  return (
    <div className="w-full">
      <Button
        type="button"
        className="w-full"
        variant="outline"
        onClick={() => onClick("google")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 mr-2">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        حساب جوجل
      </Button>
      {/* Facebook button - temporarily disabled
      <Button
        size="lg"
        className="w-full h-[55px] rounded-[8px] border-[#e6e9ea] opacity-50 cursor-not-allowed mt-3"
        variant="outline"
        disabled
        onClick={() => {
          console.log('Facebook login temporarily disabled');
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 mr-2 opacity-50">
          <path
            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            fill="currentColor"
          />
        </svg>
        Facebook (قريبًا)
      </Button>
      */}
    </div>
  );
};
