/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes = [
  "/",
  "/new-verification",
  "/admin",
  "/client",
  "/server",
  "/setting",
  "/features",
  "/pricing",
  "/blog",
  "/debug",
  "/docs",
];

/**
 * An array of routes that require authentication
 * Users must be logged in to access these routes
 * @type {string[]}
 */
export const protectedRoutes = [
  "/dashboard",
  "/onboarding",
  "/profile",
  "/settings",
];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /settings
 * @type {string[]}
 */
export const authRoutes = [
  "/login",
  "/join",
  "/error",
  "/reset",
  "/new-password",
  "/new-verification",
  "/reset"
];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * The default redirect path after logging in
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";

/**
 * Routes that require PLATFORM_ADMIN role
 * These routes are only accessible to platform administrators
 * @type {string[]}
 */
export const operatorRoutes = [
  "/dashboard", // Main operator dashboard (not subdomain)
];