# Multi-Tenant Onboarding and Subdomain Trace

This document details the user journey through the multi-tenant onboarding process, from clicking "Get Started" to being redirected to their new subdomain dashboard. It covers the current implementation, identifies areas for improvement, and outlines steps to ensure production readiness.

## 1. User Journey Trace

### 1.1. Initial Access: "Get Started" on Marketing Page

1.  **User Action**: Clicks the "Get Started" button on the marketing homepage.
2.  **Component**: `src/components/marketing/hero.tsx` (Line 40).
3.  **Redirection**: The button's `href` is set to `/onboarding`.

### 1.2. Onboarding Protection and Login Redirection

1.  **Route Interception**: The `src/middleware.ts` intercepts the `/onboarding` route.
2.  **Authentication Check**:
    *   The middleware checks `isLoggedIn` (Line 101) using `auth()` from `src/auth.ts`.
    *   If the user is **not authenticated** (`!isLoggedIn`), and the route is not public or docs (Lines 181-189), the middleware constructs a `callbackUrl` (e.g., `/onboarding`).
    *   **Redirection to Login**: The user is redirected to `/${currentLocale}/login` with `callbackUrl` as a search parameter (Lines 192-195).
3.  **Auth Configuration (`src/auth.config.ts`)**: Defines the authentication providers (Credentials, Google, Facebook).
4.  **NextAuth Callbacks (`src/auth.ts`)**:
    *   **`jwt` Callback (Lines 97-218)**: Upon successful login (especially for new OAuth users), this callback populates the JWT. If `user.merchantId` is missing, `token.needsOnboarding` is set to `true` (Line 161).
    *   **`session` Callback (Lines 220-304)**: Populates the session object with `user.needsOnboarding` flag from the JWT.
    *   **`redirect` Callback (Lines 305-940)**: Retrieves the `callbackUrl` from the URL parameters (e.g., `/onboarding`). This ensures that after a successful login, the user is redirected back to the originally intended `/onboarding` page (Lines 843-846, 863-870).

### 1.3. Onboarding Flow: Merchant Creation and Step Navigation

1.  **Landing on Onboarding**: User is redirected to `src/app/[lang]/onboarding/page.tsx`, which renders `OnboardingContent` from `src/components/onboarding/content.tsx`.
2.  **Initial Dashboard**: `OnboardingContent` displays `SchoolOnboardingDashboard` (`src/components/onboarding/overview/host-dashboard.tsx`). This shows existing merchants or options to create a new one.
3.  **"Create New" Action**: When the user clicks "Create New":
    *   `handleCreateNew` in `src/components/onboarding/content.tsx` (Line 70) is invoked.
    *   It calls the server action `initializeMerchantSetup()` from `src/components/onboarding/actions.ts` (Line 79).
    *   `initializeMerchantSetup` creates a new draft merchant in the database and stores its ID in `sessionStorage` (`currentSchoolId`).
    *   **Redirection to Overview Steps**: The user is redirected to `/onboarding/overview`, which renders `StepsOverviewClient` (`src/components/onboarding/overview/steps-overview-client.tsx`).

### 1.4. Multi-Step Forms and Final "Create" (Subdomain)

1.  **Onboarding Steps Overview (`StepsOverviewClient`)**: This component presents an overview of the three onboarding steps: "Merchant Name", "Merchant Logo", and "Merchant Domain".
2.  **Navigation**: The "Continue" button within each step (managed by a `HostFooter` or similar navigation component, which would be integrated with `useHostValidation` and `setCustomNavigation`) advances the user through the steps.
    *   **Title Step**: This is handled by a form component that updates the merchant's name.
    *   **Branding (Logo) Step**: This is handled by `src/components/onboarding/branding/content.tsx`, where users can upload a logo. This step is optional.
    *   **Subdomain Step**: This is handled by `src/components/onboarding/subdomain/content.tsx`.
        *   User inputs or selects a subdomain.
        *   Subdomain availability is checked (`checkSubdomainAvailability` from `src/components/platform/dashboard/actions.ts`).
        *   The **final "create" button** triggers the completion via `handleCompleteSetup`.
3.  **`handleCompleteSetup` in `src/components/onboarding/subdomain/content.tsx`**:
    *   Calls the server action `completeOnboarding(listing.id, normalizedSubdomain)` from `src/components/onboarding/actions.ts`.
    *   `completeOnboarding` updates the merchant record in the database with the chosen subdomain, and importantly, updates the user's `merchantId` and sets their `role` to `OWNER`.

### 1.5. Congratulations Modal and Subdomain Redirection

1.  **Displaying Congrats Modal**: After `completeOnboarding` successfully executes, `setShowCongratsModal(true)` is called in `src/components/onboarding/subdomain/content.tsx`.
2.  **`CongratsModal` (`src/components/onboarding/subdomain/congrats-modal.tsx`)**: This modal is displayed, showing a success message and the new subdomain URL.
3.  **Redirection to Dashboard**:
    *   A `setTimeout` in `src/components/onboarding/subdomain/content.tsx` automatically calls `handleNavigateToDashboard()` after 2 seconds.
    *   Alternatively, the user can click the button in the modal, which also triggers `handleNavigateToDashboard()`.
    *   `handleNavigateToDashboard` constructs the subdomain URL (e.g., `https://merchant1.databayt.org/dashboard`) and performs a full page refresh using `window.location.href`.

## 2. CRITICAL SECURITY ISSUE: Unauthorized Access to Platform Admin Dashboard

### 2.1. The Problem

**ANY authenticated user can access the Platform Admin dashboard at `src/app/[lang]/(operator)/dashboard/page.tsx`, regardless of their role.**

#### Root Cause Analysis

1. **Missing Role Protection in Route Layout**:
   - The `src/app/[lang]/(operator)/layout.tsx` (Lines 1-24) has **NO role-based access control**.
   - It only wraps children with UI providers (`SidebarProvider`, `ModalProvider`).
   - There is **NO check** for `PLATFORM_ADMIN` role before rendering the operator dashboard.

2. **Middleware Insufficient Protection**:
   - `src/middleware.ts` checks authentication but **does NOT enforce role-based access** for the `/dashboard` route.
   - Line 178: `const needsOnboarding = session?.user && !session.user.merchantId && session.user.role !== 'PLATFORM_ADMIN'`
   - Lines 201-212: Only redirects users who need onboarding when accessing dashboard, but does NOT block non-admin users from accessing the operator dashboard.
   - Lines 238-248: PLATFORM_ADMINs are redirected to `/dashboard`, but there's no logic to **prevent** non-admin users from accessing it.

3. **Auth Redirect Logic Issue**:
   - `src/auth.ts` redirect callback (Lines 238-248) correctly sends PLATFORM_ADMINs to operator dashboard.
   - Lines 260-276: Regular tenant users with `merchantId` are redirected to a generic `/dashboard` URL.
   - **The issue**: The generic `/dashboard` route resolves to the **operator dashboard** on the main domain (`me.databayt.org` or `localhost:3000`), NOT the tenant-specific subdomain dashboard.

4. **Route Ambiguity**:
   - There are TWO `/dashboard` routes:
     - **Operator Dashboard**: `src/app/[lang]/(operator)/dashboard/page.tsx` (for PLATFORM_ADMIN only)
     - **Tenant Dashboard**: `src/app/[lang]/s/[subdomain]/(platform)/dashboard/page.tsx` (for tenant users)
   - When a regular user accesses `/dashboard` on the main domain, Next.js resolves it to the operator dashboard because there's no role protection.

### 2.2. Expected Behavior

1. **PLATFORM_ADMIN users**: Should access the operator dashboard at `/dashboard` on the main domain.
2. **Regular users without merchantId**: Should be redirected to `/onboarding`.
3. **Regular users with merchantId**: Should be redirected to their tenant-specific subdomain dashboard (e.g., `merchant1.databayt.org/dashboard`).
4. **Unauthorized access attempt**: Any non-admin user trying to access the operator dashboard should be blocked and redirected appropriately.

### 2.3. Security Impact

- **High Severity**: Unauthorized users can view the platform admin interface (even if it shows "Under Process").
- **Data Exposure Risk**: If the operator dashboard displays sensitive platform-wide data, ALL authenticated users could access it.
- **Privilege Escalation**: Regular users can navigate to admin-only routes without proper authorization.

## 3. Current Progress and Gaps

### Current Progress (Functionality)

*   **Initial Redirection**: "Get Started" to `/onboarding` to `/login` (if unauthenticated), and back to `/onboarding` post-login with `callbackUrl` logic.
*   **Merchant Initialization**: Creation of a draft merchant on the "Create New" action.
*   **Multi-Step Structure**: The `StepsOverviewClient` lays out the 3 steps, and individual content components for `title`, `branding`, and `subdomain` exist.
*   **Subdomain Handling**: Generation, validation, availability checks, and reservation (`reserveSubdomainForMerchant`).
*   **Onboarding Completion**: The `completeOnboarding` action correctly updates the merchant and user roles.
*   **Post-Onboarding Redirection**: Display of `CongratsModal` and subsequent redirection to the new subdomain dashboard.

### Critical Gaps

1.  **❌ CRITICAL: No Role-Based Access Control for Operator Dashboard**:
    - The `(operator)` route group has NO protection against unauthorized access.
    - **FIX REQUIRED**: Add role check in `src/app/[lang]/(operator)/layout.tsx`.

2.  **⚠️ Middleware Route Protection Incomplete**:
    - Middleware redirects unauthenticated users but doesn't enforce role requirements for specific routes.
    - **FIX REQUIRED**: Add role-based route protection in middleware for operator routes.

3.  **⚠️ Redirect Logic for Tenant Users**:
    - `src/auth.ts` redirect callback sends tenant users to generic `/dashboard` instead of their subdomain.
    - **FIX REQUIRED**: Enhance redirect logic to properly redirect tenant users to their subdomain dashboard.

### Other Areas for Improvement

4.  **Clear Step Navigation**: The `StepsOverviewClient` currently only *describes* the steps. Need proper navigation with `HostFooter` component.

5.  **Dynamic Step Rendering**: The parent layout should manage overall progress and render correct content for current step.

6.  **Data Persistence Between Steps**: Ensure robust saving of each step's data via server actions.

7.  **Error Handling for Subdomain Creation**: Improve error messages and recovery options for subdomain reservation failures.

8.  **User Experience (UX) for Redirection**: Add visual progress indicator during redirection from `CongratsModal`.

9.  **"TEST CREATE" Button**: Replace debug button with standard navigation in `HostFooter` component.

10. **`sessionStorage` vs. `localStorage`**: Standardize storage strategy (`currentSchoolId` vs `newSubdomain`).

11. **Onboarding State Management**: Consider centralized state (React context or Zustand) for onboarding flow.

12. **URL Structure for Steps**: Current `/onboarding/${merchantId}/title` is good. Ensure consistency.

## 4. Security Fix Implementation Plan

### 4.1. Add Role Protection to Operator Layout

**File**: `src/app/[lang]/(operator)/layout.tsx`

```typescript
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ModalProvider } from "@/components/atom/modal/context";

export default async function OperatorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const session = await auth();
  const { lang } = await params;

  // CRITICAL: Only PLATFORM_ADMIN can access operator routes
  if (!session?.user || (session.user as any).role !== 'PLATFORM_ADMIN') {
    console.warn('🚨 Unauthorized access attempt to operator dashboard:', {
      userId: session?.user?.id,
      userRole: (session.user as any)?.role,
      timestamp: new Date().toISOString()
    });

    // Redirect based on user state
    if (!session?.user) {
      redirect(`/${lang}/login?callbackUrl=/${lang}/dashboard`);
    }

    const userMerchantId = (session.user as any)?.merchantId;

    // If user has no merchant, send to onboarding
    if (!userMerchantId) {
      redirect(`/${lang}/onboarding`);
    }

    // If user has merchant, redirect to their subdomain dashboard
    // This will be handled by fetching the subdomain from the database
    redirect(`/${lang}/unauthorized`); // Temporary - should fetch subdomain
  }

  return (
    <SidebarProvider>
      <ModalProvider>
        <div className="flex min-h-svh w-full flex-col">
          <div className="flex pt-6">
            <div className="w-full pb-10">{children}</div>
          </div>
        </div>
      </ModalProvider>
    </SidebarProvider>
  );
}
```

### 4.2. Enhance Middleware Protection

**File**: `src/middleware.ts`

Add operator route protection (after line 212):

```typescript
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
```

### 4.3. Fix Auth Redirect for Tenant Users

**File**: `src/auth.ts` (Lines 260-276)

Replace the generic dashboard redirect with subdomain-aware logic:

```typescript
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

      console.log('🚀 Redirecting to tenant subdomain dashboard:', tenantDashboardUrl);
      const response = NextResponse.redirect(new URL(tenantDashboardUrl));
      response.headers.set('x-request-id', requestId);
      return tenantDashboardUrl;
    } else {
      console.log('⚠️ Merchant found but no subdomain defined');
    }
  } catch (error) {
    console.error('❌ Error fetching merchant subdomain:', error);
  }

  // Fallback to onboarding if subdomain not found
  const onboardingUrl = new URL(`/${currentLocale}/onboarding`, req.url);
  const response = NextResponse.redirect(onboardingUrl);
  response.headers.set('x-request-id', requestId);
  return onboardingUrl.toString();
}
```

### 4.4. Add Route Configuration

**File**: `src/routes.ts`

Add operator routes to a new array:

```typescript
/**
 * Routes that require PLATFORM_ADMIN role
 * @type {string[]}
 */
export const operatorRoutes = [
  "/dashboard", // Main operator dashboard (not subdomain)
];
```

## 5. Production Readiness Checklist

### 5.1. Security (HIGHEST PRIORITY)

1.  ✅ **Implement Role-Based Access Control**:
    *   Add `PLATFORM_ADMIN` check in `(operator)/layout.tsx`
    *   Update middleware to block unauthorized operator route access
    *   Fix auth redirect logic for tenant users
    *   Test with different user roles (PLATFORM_ADMIN, OWNER, USER)

2.  ✅ **Input Validation**: Zod schemas enforced on server (already in place).

3.  ✅ **Authorization**: Verify `requireMerchantOwnership` and `requireRole` applied to server actions.

4.  ✅ **Rate Limiting**: Implement on subdomain reservation endpoints (`src/lib/rate-limit.ts`).

5.  ✅ **Error Logging**: Secure logging with Sentry integration (already configured).

### 5.2. Comprehensive Testing

6.  **Unit Tests**: For all server actions and utility functions.
7.  **Integration Tests**: Complete onboarding flow with role-based access.
8.  **E2E Tests**: Playwright tests for user journeys:
    - New user → onboarding → subdomain creation → subdomain dashboard
    - PLATFORM_ADMIN → operator dashboard
    - Regular user → blocked from operator dashboard
9.  **Load Testing**: Concurrent merchant creation and subdomain reservation.

### 5.3. Scalability & Performance

10. **Database Optimizations**: Index on `subdomain`, `ownerId`, `merchantId` in Merchant model.
11. **Serverless Optimization**: Optimize server actions for cold starts.
12. **Asset Optimization**: Optimize images for CongratsModal and onboarding flow.

### 5.4. Observability

13. **Enhanced Logging**: Add `requestId`, `userId`, `merchantId` to all logs (`src/lib/logger.ts`).
14. **Monitoring Alerts**: Failed onboarding, subdomain conflicts, unauthorized access attempts.

### 5.5. Infrastructure

15. **Internationalization (i18n)**: All strings localized via `getDictionary`.
16. **Accessibility (a11y)**: ARIA attributes, keyboard navigation, focus management.
17. **Environment Configuration**: Verify production env vars (`NEXTAUTH_URL`, `AUTH_SECRET`).
18. **Subdomain DNS Provisioning**: Integrate DNS provider API for automatic subdomain creation.
19. **Subdomain Uniqueness**: Race condition prevention in `completeOnboarding`.
20. **Session Management**: Ensure `merchantId` and `role` updates propagate immediately.

## 6. Summary

The multi-tenant onboarding flow is functionally complete but has a **critical security vulnerability**: unauthorized users can access the platform admin dashboard. The root cause is the lack of role-based access control in the `(operator)` route group layout.

**Immediate Action Required**:
1. Add `PLATFORM_ADMIN` role check in `src/app/[lang]/(operator)/layout.tsx`
2. Enhance middleware to block unauthorized operator route access
3. Fix auth redirect to properly send tenant users to their subdomain dashboard
4. Add comprehensive testing for role-based access control

Once these security fixes are implemented, the system will be ready for production deployment.
