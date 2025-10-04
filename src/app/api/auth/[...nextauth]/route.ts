import { GET as AuthGET, POST as AuthPOST } from "@/auth"
import { NextRequest } from "next/server"

type RouteContext = {
  params: Promise<{ nextauth: string[] }>
}

// Custom wrapper for GET requests with logging
export async function GET(req: NextRequest, context: RouteContext) {
  const params = await context.params;

  console.log('=====================================');
  console.log('📥 [Auth API] GET REQUEST');
  console.log('=====================================');
  console.log({
    path: params.nextauth?.join('/'),
    url: req.url,
    headers: {
      host: req.headers.get('host'),
      referer: req.headers.get('referer'),
      'user-agent': req.headers.get('user-agent'),
      'x-forwarded-for': req.headers.get('x-forwarded-for'),
      'x-forwarded-host': req.headers.get('x-forwarded-host'),
    },
    searchParams: Object.fromEntries(req.nextUrl.searchParams.entries()),
    cookies: req.cookies.getAll().map(c => ({ name: c.name, value: c.value?.substring(0, 20) + '...' })),
    timestamp: new Date().toISOString()
  });

  // Special logging for callback endpoints
  if (params.nextauth?.includes('callback')) {
    console.error('🔐 [CALLBACK] Provider:', params.nextauth[1]);
    console.error('🔐 [CALLBACK] Has code:', req.nextUrl.searchParams.has('code'));
    console.error('🔐 [CALLBACK] Has error:', req.nextUrl.searchParams.has('error'));
    console.error('🔐 [CALLBACK] Error:', req.nextUrl.searchParams.get('error'));
    console.error('🔐 [CALLBACK] Error desc:', req.nextUrl.searchParams.get('error_description'));
    
    const allCookies = req.cookies.getAll();
    const cookieNames = allCookies.map(c => c.name).join(', ');
    console.error('🔐 [CALLBACK] Cookie names:', cookieNames);
    console.error('🔐 [CALLBACK] Has PKCE:', allCookies.some(c => c.name.includes('pkce')));
    console.error('🔐 [CALLBACK] Has state:', allCookies.some(c => c.name.includes('state')));
  }

  try {
    // Call the original AuthGET handler
    const response = await AuthGET(req);
    
    console.log('✅ [Auth API] GET Response:', {
      status: response.status,
      statusText: response.statusText,
      path: params.nextauth?.join('/'),
      location: response.headers.get('location'),
      hasSetCookie: response.headers.has('set-cookie'),
    });
    
    // If redirecting to error, log the full URL
    const locationHeader = response.headers.get('location');
    if (locationHeader?.includes('/error')) {
      console.error('❌ [ERROR REDIRECT] Location:', locationHeader);
      
      // Parse error from location URL
      try {
        const errorUrl = new URL(locationHeader, 'https://me.databayt.org');
        const errorCode = errorUrl.searchParams.get('error');
        console.error('❌ [ERROR REDIRECT] Error code:', errorCode);
        const allParams = Object.fromEntries(errorUrl.searchParams.entries());
        console.error('❌ [ERROR REDIRECT] Params:', JSON.stringify(allParams));
      } catch (e) {
        console.error('❌ [ERROR REDIRECT] Parse failed:', e);
      }
      
      console.error('❌ [ERROR REDIRECT] Request URL:', req.url);
      const reqParams = Object.fromEntries(req.nextUrl.searchParams.entries());
      console.error('❌ [ERROR REDIRECT] Request params:', JSON.stringify(reqParams));
    }
    
    return response;
  } catch (error) {
    console.error('=====================================');
    console.error('❌ [Auth API] GET EXCEPTION CAUGHT');
    console.error('=====================================');
    console.error('Error type:', typeof error);
    console.error('Error:', error);
    console.error('Message:', error instanceof Error ? error.message : 'Unknown');
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Path:', params.nextauth?.join('/'));
    console.error('=====================================\n');
    throw error;
  }
}

// Custom wrapper for POST requests with logging
export async function POST(req: NextRequest, context: RouteContext) {
  const params = await context.params;

  console.log('=====================================');
  console.log('📥 [Auth API] POST REQUEST');
  console.log('=====================================');
  console.log({
    path: params.nextauth?.join('/'),
    url: req.url,
    headers: {
      host: req.headers.get('host'),
      referer: req.headers.get('referer'),
      'content-type': req.headers.get('content-type'),
      'user-agent': req.headers.get('user-agent'),
      'x-forwarded-for': req.headers.get('x-forwarded-for'),
      'x-forwarded-host': req.headers.get('x-forwarded-host'),
    },
    searchParams: Object.fromEntries(req.nextUrl.searchParams.entries()),
    cookies: req.cookies.getAll().map(c => ({ name: c.name, value: c.value?.substring(0, 20) + '...' })),
    timestamp: new Date().toISOString()
  });

  // Log body for signin requests
  if (params.nextauth?.includes('signin')) {
    try {
      const clonedReq = req.clone();
      const body = await clonedReq.text();
      console.log('📝 [Auth API] POST Body (signin):', {
        hasBody: !!body,
        bodyLength: body?.length,
        bodyPreview: body?.substring(0, 200)
      });
    } catch (e) {
      console.log('⚠️ Could not read POST body:', e);
    }
  }

  try {
    // Call the original AuthPOST handler
    const response = await AuthPOST(req);
    
    const location = response.headers.get('location');
    console.log('✅ [Auth API] POST Response:', {
      status: response.status,
      statusText: response.statusText,
      path: params.nextauth?.join('/'),
      hasLocation: !!location,
      location: location,
      hasSetCookie: response.headers.has('set-cookie'),
    });
    
    // Log if this is a signin response
    if (params.nextauth?.includes('signin') && location) {
      console.log('=====================================');
      console.log('🔐 [OAUTH SIGNIN] Response details');
      console.log('=====================================');
      console.log('Redirect location:', location);
      console.log('Is Google OAuth URL:', location?.includes('accounts.google.com'));
      console.log('Has client_id:', location?.includes('client_id'));
      console.log('Has redirect_uri:', location?.includes('redirect_uri'));
      console.log('Has code_challenge:', location?.includes('code_challenge'));
      console.log('Set-Cookie headers:', response.headers.getSetCookie());
      console.log('=====================================\n');
    }
    
    return response;
  } catch (error) {
    console.error('=====================================');
    console.error('❌ [Auth API] POST EXCEPTION');
    console.error('=====================================');
    console.error('Error:', error);
    console.error('Message:', error instanceof Error ? error.message : 'Unknown');
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Path:', params.nextauth?.join('/'));
    console.error('=====================================\n');
    throw error;
  }
}
