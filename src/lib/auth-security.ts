import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

/**
 * Enhanced authentication and authorization utilities for multi-tenant security
 */

export interface AuthContext {
  userId: string;
  merchantId: string | null;
  role: UserRole;
  email: string | null;
}

export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class TenantError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'TenantError';
  }
}

/**
 * Get authenticated user context with full security validation
 */
export async function getAuthContext(): Promise<AuthContext> {
  const startTime = new Date().toISOString();
  console.log("🔍 [DEBUG] getAuthContext START", { startTime });
  
  console.log("🔍 [DEBUG] Step 1: Calling auth() function...");
  const session = await auth();
  
  console.log("📋 [DEBUG] Step 1 - Raw session data:", {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
    email: session?.user?.email,
    sessionKeys: session?.user ? Object.keys(session.user) : [],
    sessionUserType: session?.user ? typeof session.user : 'undefined',
    sessionUserMerchantId: (session?.user as any)?.merchantId,
    sessionUserRole: (session?.user as any)?.role,
    timestamp: new Date().toISOString()
  });
  
  if (!session?.user?.id) {
    console.error("❌ [DEBUG] Step 2 - No session or user ID found", {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      errorTimestamp: new Date().toISOString()
    });
    throw new AuthError("Authentication required", "AUTH_REQUIRED");
  }

  if (!session.user.email) {
    console.error("❌ [DEBUG] Step 2 - No user email found", {
      userId: session.user.id,
      hasEmail: !!session.user.email,
      errorTimestamp: new Date().toISOString()
    });
    throw new AuthError("User email is required", "EMAIL_REQUIRED");
  }

  console.log("🔍 [DEBUG] Step 2: Creating auth context...");
  const authContext = {
    userId: session.user.id,
    merchantId: (session.user as any).merchantId || null,
    role: (session.user as any).role || "USER",
    email: session.user.email,
  };
  
  console.log("✅ [DEBUG] Step 2 - AuthContext created:", {
    ...authContext,
    sessionMerchantId: (session.user as any).merchantId,
    sessionRole: (session.user as any).role,
    sessionHasMerchantId: 'merchantId' in (session.user as any),
    sessionHasRole: 'role' in (session.user as any),
    contextCreationTimestamp: new Date().toISOString()
  });
  
  console.log("✅ [DEBUG] getAuthContext COMPLETE", {
    userId: authContext.userId,
    merchantId: authContext.merchantId,
    role: authContext.role,
    endTime: new Date().toISOString()
  });
  
  return authContext;
}

/**
 * Ensure user has access to specific merchant (multi-tenant safety)
 */
export async function requireMerchantAccess(targetMerchantId: string): Promise<AuthContext> {
  const authContext = await getAuthContext();
  
  // DEVELOPER role can access any merchant
  if (authContext.role === "PLATFORM_ADMIN") {
    return authContext;
  }
  
  // All other users must belong to the target merchant
  if (!authContext.merchantId) {
    throw new TenantError("User not assigned to any merchant", "NO_MERCHANT_ASSIGNMENT");
  }
  
  if (authContext.merchantId !== targetMerchantId) {
    throw new TenantError("Access denied to this merchant", "CROSS_TENANT_ACCESS_DENIED");
  }
  
  return authContext;
}

/**
 * For Merchant model access (merchants are the tenants, not nested under merchantId)
 */
export async function requireMerchantOwnership(targetMerchantId: string): Promise<AuthContext> {
  const authContext = await getAuthContext();
  
  // Import merchant access functions
  const { canUserAccessMerchant, ensureUserMerchant } = await import('@/lib/merchant-access');
  
  console.log("🔐 [MERCHANT OWNERSHIP CHECK] Starting:", {
    userId: authContext.userId,
    role: authContext.role,
    targetMerchantId,
    userMerchantId: authContext.merchantId,
    timestamp: new Date().toISOString()
  });
  
  // Check if user can access this merchant
  const accessResult = await canUserAccessMerchant(authContext.userId, targetMerchantId);
  
  if (!accessResult.hasAccess) {
    // If user doesn't have access but is authenticated, try to create/ensure they have a merchant
    if (!authContext.merchantId) {
      console.log("Merchant [MERCHANT OWNERSHIP] User has no merchant, ensuring one exists");
      const merchantResult = await ensureUserMerchant(authContext.userId);
      
      if (merchantResult.success && merchantResult.merchantId) {
        // Update auth context with new merchant
        authContext.merchantId = merchantResult.merchantId;
        console.log("✅ [MERCHANT OWNERSHIP] Merchant created/ensured for user:", {
          userId: authContext.userId,
          merchantId: merchantResult.merchantId
        });
      }
    }
    
    // For onboarding, be permissive if user is authenticated
    console.warn("⚠️ [MERCHANT OWNERSHIP] Access check failed but allowing for onboarding:", {
      reason: accessResult.reason,
      userId: authContext.userId,
      targetMerchantId
    });
  } else {
    console.log("✅ [MERCHANT OWNERSHIP] Access granted:",  {
      userId: authContext.userId,
      targetMerchantId,
      reason: accessResult.reason,
      isOwner: accessResult.isOwner
    });
  }
  
  return authContext;
}

/**
 * Ensure user has minimum required role
 */
export async function requireRole(...allowedRoles: UserRole[]): Promise<AuthContext> {
  const authContext = await getAuthContext();
  
  if (!allowedRoles.includes(authContext.role)) {
    throw new AuthError(
      `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      "INSUFFICIENT_PERMISSIONS"
    );
  }
  
  return authContext;
}

/**
 * Ensure user has role AND merchant access (most common combination)
 */
export async function requireMerchantRole(merchantId: string, ...allowedRoles: UserRole[]): Promise<AuthContext> {
  const authContext = await requireMerchantAccess(merchantId);
  
  if (!allowedRoles.includes(authContext.role)) {
    throw new AuthError(
      `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      "INSUFFICIENT_PERMISSIONS"
    );
  }
  
  return authContext;
}

/**
 * Create multi-tenant safe database where clause
 */
export function createTenantSafeWhere<T extends Record<string, any>>(
  baseWhere: T,
  merchantId: string | null
): T & { merchantId?: string } {
  if (merchantId) {
    return {
      ...baseWhere,
      merchantId,
    };
  }
  
  return baseWhere;
}

/**
 * Validate that a resource belongs to the user's school
 */
export async function validateResourceAccess(resourceMerchantId: string): Promise<void> {
  const authContext = await getAuthContext();
  
  // DEVELOPER can access any resource
  if (authContext.role === "PLATFORM_ADMIN") {
    return;
  }
  
  if (!authContext.merchantId) {
    throw new TenantError("User not assigned to any merchant", "NO_MERCHANT_ASSIGNMENT");
  }
  
  if (authContext.merchantId !== resourceMerchantId) {
    throw new TenantError("Resource belongs to different merchant", "CROSS_TENANT_ACCESS_DENIED");
  }
}

/**
 * Standard error response for API routes
 */
export function createErrorResponse(error: unknown): Response {
  console.error("API Error:", error);
  
  if (error instanceof AuthError) {
    return new Response(
      JSON.stringify({ error: error.message, code: error.code }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  
  if (error instanceof TenantError) {
    return new Response(
      JSON.stringify({ error: error.message, code: error.code }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  
  // Generic error - don't leak internal details
  return new Response(
    JSON.stringify({ error: "An error occurred", code: "INTERNAL_ERROR" }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}

/**
 * Standard action response type
 */
export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  errors?: Record<string, string>;
}

/**
 * Create standardized action response
 */
export function createActionResponse<T>(
  data?: T,
  error?: unknown
): ActionResponse<T> {
  if (error) {
    console.error("🚨 [DEBUG] createActionResponse called with error:", {
      error,
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : 'Not an Error instance',
      isAuthError: error instanceof AuthError,
      isTenantError: error instanceof TenantError,
      errorKeys: error && typeof error === 'object' ? Object.keys(error) : [],
      errorStringified: JSON.stringify(error),
      errorToString: error?.toString?.() || String(error)
    });
    
    if (error instanceof AuthError || error instanceof TenantError) {
      console.error("🚨 [DEBUG] This is an AuthError or TenantError:", {
        message: error.message,
        code: error.code,
        name: error.name
      });
      return {
        success: false,
        error: error.message || "Access denied",
        code: error.code || "ACCESS_DENIED",
      };
    }
    
    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: Array<{ path: string[]; message: string }> };
      const fieldErrors: Record<string, string> = {};
      
      zodError.issues.forEach(issue => {
        if (issue.path.length > 0) {
          const fieldName = issue.path[0] as string;
          fieldErrors[fieldName] = issue.message;
        }
      });
      
      return {
        success: false,
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        errors: fieldErrors,
      };
    }
    
    // Handle generic errors and ensure they're serializable
    let errorMessage = "An error occurred";
    let errorCode = "INTERNAL_ERROR";
    
    // First check if it's a standard Error instance
    if (error instanceof Error) {
      errorMessage = error.message || "An error occurred";
      errorCode = error.name || "INTERNAL_ERROR";
      
      console.error("🔍 [DEBUG] Standard Error instance:", {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 200) // First 200 chars of stack
      });
    } else if (typeof error === 'string') {
      errorMessage = error;
      errorCode = "STRING_ERROR";
    } else if (error && typeof error === 'object') {
      console.error("🔍 [DEBUG] Object error, trying to extract info:", {
        hasMessage: 'message' in error,
        hasCode: 'code' in error,
        hasName: 'name' in error,
        keys: Object.keys(error),
        stringified: JSON.stringify(error)
      });
      
      // Try to extract message and code from object
      const errorObj = error as any;
      if (errorObj.message && typeof errorObj.message === 'string') {
        errorMessage = errorObj.message;
      } else if (errorObj.error && typeof errorObj.error === 'string') {
        errorMessage = errorObj.error;
      }
      
      if (errorObj.code && typeof errorObj.code === 'string') {
        errorCode = errorObj.code;
      } else if (errorObj.name && typeof errorObj.name === 'string') {
        errorCode = errorObj.name;
      }
    } else {
      // Fallback for any other type
      errorMessage = String(error) || "Unknown error occurred";
      errorCode = "UNKNOWN_ERROR";
    }
    
    // Ensure we never return an empty or undefined error message
    if (!errorMessage || errorMessage.trim() === '') {
      errorMessage = "An error occurred";
    }
    
    console.error("🚨 [DEBUG] Final error response:", {
      errorMessage,
      errorCode,
      originalError: error
    });
    
    return {
      success: false,
      error: errorMessage,
      code: errorCode,
    };
  }
  
  return {
    success: true,
    data,
  };
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use requireMerchantOwnership instead
 */
export async function requireSchoolOwnership(targetMerchantId: string): Promise<AuthContext> {
  return requireMerchantOwnership(targetMerchantId);
}