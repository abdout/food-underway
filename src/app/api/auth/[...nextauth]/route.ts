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
    console.log('🔐 [OAUTH CALLBACK] Detected:', {
      provider: params.nextauth[1],
      query: Object.fromEntries(req.nextUrl.searchParams.entries()),
      cookies: req.cookies.getAll().map(c => ({ 
        name: c.name, 
        hasValue: !!c.value,
        valueLength: c.value?.length 
      })),
      hasPKCE: req.cookies.has('authjs.pkce.code_verifier'),
      hasCode: req.nextUrl.searchParams.has('code'),
      hasError: req.nextUrl.searchParams.has('error'),
    });
  }

  try {
    // Call the original AuthGET handler
    const response = await AuthGET(req);
    console.log('✅ [Auth API] GET Response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      hasSetCookie: response.headers.has('set-cookie'),
      path: params.nextauth?.join('/'),
      location: response.headers.get('location')
    });
    return response;
  } catch (error) {
    console.error('❌ [Auth API] GET Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      path: params.nextauth?.join('/')
    });
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
    console.log('✅ [Auth API] POST Response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      hasSetCookie: response.headers.has('set-cookie'),
      hasLocation: response.headers.has('location'),
      location: response.headers.get('location'),
      path: params.nextauth?.join('/')
    });
    return response;
  } catch (error) {
    console.error('❌ [Auth API] POST Error:', error);
    throw error;
  }
}
