"use server";

import { signOut } from "@/auth";
import { headers } from "next/headers";

export const logout = async () => {
  console.log('🚪 LOGOUT ACTION TRIGGERED');

  // Get the current URL to determine locale
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('referer') || '/';

  // Extract locale from pathname (e.g., /ar/... or /en/...)
  const localeMatch = pathname.match(/^\/(ar|en)(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : 'ar'; // Default to Arabic

  console.log('🚪 LOGOUT - Current locale:', locale, 'from pathname:', pathname);

  // Sign out and redirect to home page with locale
  await signOut({
    redirectTo: `/${locale}`,
    redirect: true
  });
};
